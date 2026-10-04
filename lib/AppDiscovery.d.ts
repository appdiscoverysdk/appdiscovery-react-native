import { OfferwallInstance } from "./OfferwallInstance";
import { AppDiscoveryInitConfig, AppDiscoveryOfferwallOptions, AppDiscoveryReward } from "./types";
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
export declare class AppDiscovery {
    private static host;
    private static trackerHost;
    private static appId;
    private static sdkKey;
    private static playerId;
    private static initialized;
    private static rewardListeners;
    private static closeListeners;
    private static rewardSubscription;
    private static closeSubscription;
    /**
     * Initializes the SDK and stores the configuration.
     *
     * `host` is the host of your offerwall (for example `offers.example.com`; an
     * `https://` URL is accepted). The promise rejects with an `Error` when it is
     * missing or is not a plain host name.
     */
    static init(config: AppDiscoveryInitConfig): Promise<boolean>;
    static init(host: string, appId: string, sdkKey: string, playerId?: string, trackerHost?: string): Promise<boolean>;
    /**
     * Creates an `OfferwallInstance` with its own configuration, the equivalent of
     * `AppDiscovery.create(...)` in the native SDKs.
     * @throws Error when `host` (or `trackerHost`) is not a valid host.
     */
    static create(host: string, appId: string, sdkKey: string, playerId: string, trackerHost?: string): OfferwallInstance;
    /** Updates the active player / user id. */
    static setUserId(playerId: string): Promise<boolean>;
    /**
     * Shows the offerwall. Values not passed in `options` come from `init`.
     *
     * Resolves `false` when `appId` or `sdkKey` is missing or the platform could not
     * present the offerwall. Rejects with an `Error` when the host is missing or is
     * not a valid host.
     */
    static showOfferwall(options?: AppDiscoveryOfferwallOptions): Promise<boolean>;
    /**
     * Delivers rewards the player earned while the app was closed, without opening
     * the offerwall, and resolves with the rewards that were found.
     *
     * The native SDK also hands these rewards to the `onReward` listener of an
     * offerwall that was shown earlier in this session; do not credit a `txid` twice.
     */
    static syncPendingRewards(options?: AppDiscoveryOfferwallOptions): Promise<AppDiscoveryReward[]>;
    /** Subscribes to reward events. Returns a function that removes the listener. */
    static onReward(callback: (reward: AppDiscoveryReward) => void): () => void;
    /** Subscribes to offerwall close events. Returns a function that removes the listener. */
    static onClose(callback: () => void): () => void;
    /** Updates stored configuration at runtime. A new `host` or `trackerHost` is validated like in `init`. */
    static setConfig(config: Partial<AppDiscoveryInitConfig>): void;
    /** The configured offerwall host (empty before `init`). */
    static getHost(): string;
    /** The configured tracker host, or undefined when it is the offerwall host. */
    static getTrackerHost(): string | undefined;
    static getAppId(): string;
    static getSdkKey(): string;
    static getPlayerId(): string;
    /** Whether `init` has been called. */
    static isInitialized(): boolean;
    private static setupNativeEventListeners;
    /** Removes every listener added with `onReward` and `onClose`. */
    static removeAllListeners(): void;
    /** Resets stored configuration and listeners. For tests only. */
    static resetForTesting(): void;
}
