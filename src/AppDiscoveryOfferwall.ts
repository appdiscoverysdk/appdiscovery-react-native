import { AppDiscovery } from "./AppDiscovery";
import { OfferwallInstance } from "./OfferwallInstance";

/** Factory helpers for offerwalls that carry their own configuration. */
export class AppDiscoveryOfferwall {
  /**
   * Creates a new offerwall instance, like the native `AppDiscovery.create`.
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

  /** Shows the native offerwall directly. */
  public static async showOfferwall(
    host: string,
    appId: string,
    sdkKey: string,
    playerId: string,
    trackerHost?: string
  ): Promise<boolean> {
    return AppDiscovery.showOfferwall({ host, appId, sdkKey, playerId, trackerHost });
  }
}
