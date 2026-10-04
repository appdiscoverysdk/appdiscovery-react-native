import { AppDiscovery } from "./AppDiscovery";
import { normalizeHost, normalizeOptionalHost } from "./host";
import { AppDiscoveryOfferwallConfig, AppDiscoveryReward } from "./types";

/**
 * A configured offerwall that can be shown, mirroring the `Offerwall` object of
 * the native SDKs. Create one with `AppDiscovery.create`.
 */
export class OfferwallInstance {
  /** Normalised host of the offerwall. */
  public readonly host: string;
  /** Normalised tracker host, or undefined when it is the offerwall host. */
  public readonly trackerHost?: string;
  public appId: string;
  public sdkKey: string;
  public playerId: string;

  public onReward?: (reward: AppDiscoveryReward) => void;
  public onClose?: () => void;

  private unsubReward: (() => void) | null = null;
  private unsubClose: (() => void) | null = null;

  /** @throws Error when `host` (or `trackerHost`) is not a valid host. */
  constructor(host: string, appId: string, sdkKey: string, playerId: string, trackerHost?: string) {
    this.host = normalizeHost(host);
    this.trackerHost = normalizeOptionalHost(trackerHost, "trackerHost");
    this.appId = appId;
    this.sdkKey = sdkKey;
    this.playerId = playerId;
  }

  public getConfig(): AppDiscoveryOfferwallConfig {
    return {
      host: this.host,
      trackerHost: this.trackerHost,
      appId: this.appId,
      sdkKey: this.sdkKey,
      playerId: this.playerId,
      onReward: this.onReward,
      onClose: this.onClose,
    };
  }

  /** Shows the offerwall. Resolves `false` when the platform could not present it. */
  public async show(): Promise<boolean> {
    this.removeListeners();

    if (this.onReward) {
      this.unsubReward = AppDiscovery.onReward((reward) => {
        if (this.onReward) {
          this.onReward(reward);
        }
      });
    }

    if (this.onClose) {
      this.unsubClose = AppDiscovery.onClose(() => {
        if (this.onClose) {
          this.onClose();
        }
        this.removeListeners();
      });
    }

    return AppDiscovery.showOfferwall({
      host: this.host,
      trackerHost: this.trackerHost,
      appId: this.appId,
      sdkKey: this.sdkKey,
      playerId: this.playerId,
    });
  }

  private removeListeners() {
    if (this.unsubReward) {
      this.unsubReward();
      this.unsubReward = null;
    }
    if (this.unsubClose) {
      this.unsubClose();
      this.unsubClose = null;
    }
  }
}
