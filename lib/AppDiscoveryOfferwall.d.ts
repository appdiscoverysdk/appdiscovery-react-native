import { OfferwallInstance } from "./OfferwallInstance";
/** Factory helpers for offerwalls that carry their own configuration. */
export declare class AppDiscoveryOfferwall {
    /**
     * Creates a new offerwall instance, like the native `AppDiscovery.create`.
     * @throws Error when `host` (or `trackerHost`) is not a valid host.
     */
    static create(host: string, appId: string, sdkKey: string, playerId: string, trackerHost?: string): OfferwallInstance;
    /** Shows the native offerwall directly. */
    static showOfferwall(host: string, appId: string, sdkKey: string, playerId: string, trackerHost?: string): Promise<boolean>;
}
