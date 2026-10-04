import { NativeModules, NativeEventEmitter, EmitterSubscription } from "react-native";
import { normalizeHost, normalizeOptionalHost } from "./host";
import { OfferwallInstance } from "./OfferwallInstance";
import {
  AppDiscoveryInitConfig,
  AppDiscoveryOfferwallOptions,
  AppDiscoveryReward,
} from "./types";

const REWARD_EVENT = "onAppDiscoveryReward";
const CLOSE_EVENT = "onAppDiscoveryClose";

function nativeModule(): any {
  return NativeModules.AppDiscoveryModule;
}

let emitter: NativeEventEmitter | null = null;

function getEventEmitter(): NativeEventEmitter | null {
  const native = nativeModule();
  if (!emitter && native) {
    try {
      emitter = new NativeEventEmitter(native);
    } catch (e) {
      console.warn("[AppDiscovery SDK] Failed to initialize NativeEventEmitter:", e);
    }
  }
  return emitter;
}

function firstNonEmpty(preferred: string | undefined, fallback: string): string {
  const p = (preferred ?? "").trim();
  return p.length > 0 ? p : fallback;
}

/**
 * Entry point of the AppDiscovery offerwall SDK.
 *
 * Every integration points the SDK at its own offerwall, so `host` is a required
 * setting and there is no default.
 *
 * ```ts
 * await AppDiscovery.init({ host: "offers.example.com", appId: "YOUR_APP_ID", sdkKey: "YOUR_SDK_KEY", playerId: "player_123" });
 * AppDiscovery.onReward((reward) => console.log(reward.amount));
 * await AppDiscovery.showOfferwall();
 * ```
 */
export class AppDiscovery {
  private static host: string = "";
  private static trackerHost: string | undefined = undefined;
  private static appId: string = "";
  private static sdkKey: string = "";
  private static playerId: string = "";
  private static initialized: boolean = false;

  private static rewardListeners: Set<(reward: AppDiscoveryReward) => void> = new Set();
  private static closeListeners: Set<() => void> = new Set();

  private static rewardSubscription: EmitterSubscription | null = null;
  private static closeSubscription: EmitterSubscription | null = null;

  /**
   * Initializes the SDK and stores the configuration.
   *
   * `host` is the host of your offerwall (for example `offers.example.com`; an
   * `https://` URL is accepted). The promise rejects with an `Error` when it is
   * missing or is not a plain host name.
   */
  public static async init(config: AppDiscoveryInitConfig): Promise<boolean>;
  public static async init(
    host: string,
    appId: string,
    sdkKey: string,
    playerId?: string,
    trackerHost?: string
  ): Promise<boolean>;
  public static async init(
    configOrHost: AppDiscoveryInitConfig | string,
    appId?: string,
    sdkKey?: string,
    playerId?: string,
    trackerHost?: string
  ): Promise<boolean> {
    const config: AppDiscoveryInitConfig =
      typeof configOrHost === "object"
        ? configOrHost
        : { host: configOrHost, appId: appId ?? "", sdkKey: sdkKey ?? "", playerId, trackerHost };

    const host = normalizeHost(config.host);
    const tracker = normalizeOptionalHost(config.trackerHost, "trackerHost");

    AppDiscovery.host = host;
    AppDiscovery.trackerHost = tracker;
    AppDiscovery.appId = (config.appId || "").trim();
    AppDiscovery.sdkKey = (config.sdkKey || "").trim();
    AppDiscovery.playerId = (config.playerId || "").trim();

    AppDiscovery.setupNativeEventListeners();
    AppDiscovery.initialized = true;

    const native = nativeModule();
    if (native && typeof native.initSDK === "function") {
      try {
        await native.initSDK(host, AppDiscovery.appId, AppDiscovery.sdkKey, {
          playerId: AppDiscovery.playerId,
          trackerHost: tracker ?? "",
        });
      } catch (err) {
        console.warn("[AppDiscovery SDK] Native initSDK warning:", err);
      }
    }

    return true;
  }

  /**
   * Creates an `OfferwallInstance` with its own configuration, the equivalent of
   * `AppDiscovery.create(...)` in the native SDKs.
   * @throws Error when `host` (or `trackerHost`) is not a valid host.
   */
  public static create(
    host: string,
    appId: string,
    sdkKey: string,
    playerId: string,
    trackerHost?: string
  ): OfferwallInstance {
    return new OfferwallInstance(host, appId, sdkKey, playerId, trackerHost);
  }

  /** Updates the active player / user id. */
  public static async setUserId(playerId: string): Promise<boolean> {
    AppDiscovery.playerId = (playerId || "").trim();

    const native = nativeModule();
    if (native && typeof native.setUserId === "function") {
      try {
        await native.setUserId(AppDiscovery.playerId);
      } catch (err) {
        console.warn("[AppDiscovery SDK] Native setUserId warning:", err);
      }
    }

    return true;
  }

  /**
   * Shows the offerwall. Values not passed in `options` come from `init`.
   *
   * Resolves `false` when `appId` or `sdkKey` is missing or the platform could not
   * present the offerwall. Rejects with an `Error` when the host is missing or is
   * not a valid host.
   */
  public static async showOfferwall(options?: AppDiscoveryOfferwallOptions): Promise<boolean> {
    const hostArg = (options?.host ?? "").trim();
    const host = normalizeHost(firstNonEmpty(options?.host, AppDiscovery.host));
    // The stored tracker host belongs to the stored host only.
    const tracker =
      normalizeOptionalHost(options?.trackerHost, "trackerHost") ??
      (hostArg.length === 0 ? AppDiscovery.trackerHost : undefined);
    const appId = firstNonEmpty(options?.appId, AppDiscovery.appId);
    const sdkKey = firstNonEmpty(options?.sdkKey, AppDiscovery.sdkKey);
    const playerId = firstNonEmpty(options?.playerId, AppDiscovery.playerId);

    if (!appId || !sdkKey) {
      console.error("[AppDiscovery SDK] Error: appId and sdkKey are required before showing the offerwall.");
      return false;
    }

    if (!playerId) {
      console.warn("[AppDiscovery SDK] Warning: playerId is empty. Make sure the user is logged in or the playerId is set.");
    }

    const native = nativeModule();
    if (!native) {
      console.warn(
        "[AppDiscovery SDK] Native module 'AppDiscoveryModule' is not linked. Please ensure native modules are installed."
      );
      return false;
    }

    AppDiscovery.setupNativeEventListeners();

    try {
      return await native.showOfferwall(host, appId, sdkKey, playerId, tracker ?? "");
    } catch (err) {
      console.error("[AppDiscovery SDK] Failed to show offerwall:", err);
      return false;
    }
  }

  /**
   * Delivers rewards the player earned while the app was closed, without opening
   * the offerwall, and resolves with the rewards that were found.
   *
   * The native SDK also hands these rewards to the `onReward` listener of an
   * offerwall that was shown earlier in this session; do not credit a `txid` twice.
   */
  public static async syncPendingRewards(options?: AppDiscoveryOfferwallOptions): Promise<AppDiscoveryReward[]> {
    const hostArg = (options?.host ?? "").trim();
    const host = normalizeHost(firstNonEmpty(options?.host, AppDiscovery.host));
    const tracker =
      normalizeOptionalHost(options?.trackerHost, "trackerHost") ??
      (hostArg.length === 0 ? AppDiscovery.trackerHost : undefined);
    const appId = firstNonEmpty(options?.appId, AppDiscovery.appId);
    const sdkKey = firstNonEmpty(options?.sdkKey, AppDiscovery.sdkKey);
    const playerId = firstNonEmpty(options?.playerId, AppDiscovery.playerId);

    if (!appId || !sdkKey || !playerId) {
      console.error("[AppDiscovery SDK] Error: appId, sdkKey and playerId are required to sync rewards.");
      return [];
    }

    const native = nativeModule();
    if (!native || typeof native.syncPendingRewards !== "function") {
      console.warn("[AppDiscovery SDK] Native module 'AppDiscoveryModule' is not linked.");
      return [];
    }

    try {
      const rewards = await native.syncPendingRewards(host, appId, sdkKey, playerId, tracker ?? "");
      return Array.isArray(rewards) ? rewards : [];
    } catch (err) {
      console.error("[AppDiscovery SDK] Failed to sync pending rewards:", err);
      return [];
    }
  }

  /** Subscribes to reward events. Returns a function that removes the listener. */
  public static onReward(callback: (reward: AppDiscoveryReward) => void): () => void {
    AppDiscovery.rewardListeners.add(callback);
    AppDiscovery.setupNativeEventListeners();

    return () => {
      AppDiscovery.rewardListeners.delete(callback);
    };
  }

  /** Subscribes to offerwall close events. Returns a function that removes the listener. */
  public static onClose(callback: () => void): () => void {
    AppDiscovery.closeListeners.add(callback);
    AppDiscovery.setupNativeEventListeners();

    return () => {
      AppDiscovery.closeListeners.delete(callback);
    };
  }

  /** Updates stored configuration at runtime. A new `host` or `trackerHost` is validated like in `init`. */
  public static setConfig(config: Partial<AppDiscoveryInitConfig>): void {
    if (config.host !== undefined) AppDiscovery.host = normalizeHost(config.host);
    if (config.trackerHost !== undefined) {
      AppDiscovery.trackerHost = normalizeOptionalHost(config.trackerHost, "trackerHost");
    }
    if (config.appId !== undefined) AppDiscovery.appId = (config.appId || "").trim();
    if (config.sdkKey !== undefined) AppDiscovery.sdkKey = (config.sdkKey || "").trim();
    if (config.playerId !== undefined) void AppDiscovery.setUserId(config.playerId || "");
  }

  /** The configured offerwall host (empty before `init`). */
  public static getHost(): string {
    return AppDiscovery.host;
  }

  /** The configured tracker host, or undefined when it is the offerwall host. */
  public static getTrackerHost(): string | undefined {
    return AppDiscovery.trackerHost;
  }

  public static getAppId(): string {
    return AppDiscovery.appId;
  }

  public static getSdkKey(): string {
    return AppDiscovery.sdkKey;
  }

  public static getPlayerId(): string {
    return AppDiscovery.playerId;
  }

  /** Whether `init` has been called. */
  public static isInitialized(): boolean {
    return AppDiscovery.initialized;
  }

  private static setupNativeEventListeners() {
    const em = getEventEmitter();
    if (!em) return;

    if (!AppDiscovery.rewardSubscription) {
      AppDiscovery.rewardSubscription = em.addListener(REWARD_EVENT, (reward: AppDiscoveryReward) => {
        AppDiscovery.rewardListeners.forEach((listener) => {
          try {
            listener(reward);
          } catch (e) {
            console.error("[AppDiscovery SDK] Exception in onReward listener:", e);
          }
        });
      });
    }

    if (!AppDiscovery.closeSubscription) {
      AppDiscovery.closeSubscription = em.addListener(CLOSE_EVENT, () => {
        AppDiscovery.closeListeners.forEach((listener) => {
          try {
            listener();
          } catch (e) {
            console.error("[AppDiscovery SDK] Exception in onClose listener:", e);
          }
        });
      });
    }
  }

  /** Removes every listener added with `onReward` and `onClose`. */
  public static removeAllListeners(): void {
    AppDiscovery.rewardListeners.clear();
    AppDiscovery.closeListeners.clear();

    if (AppDiscovery.rewardSubscription) {
      AppDiscovery.rewardSubscription.remove();
      AppDiscovery.rewardSubscription = null;
    }
    if (AppDiscovery.closeSubscription) {
      AppDiscovery.closeSubscription.remove();
      AppDiscovery.closeSubscription = null;
    }
  }

  /** Resets stored configuration and listeners. For tests only. */
  public static resetForTesting(): void {
    AppDiscovery.removeAllListeners();
    emitter = null;
    AppDiscovery.host = "";
    AppDiscovery.trackerHost = undefined;
    AppDiscovery.appId = "";
    AppDiscovery.sdkKey = "";
    AppDiscovery.playerId = "";
    AppDiscovery.initialized = false;
  }
}
