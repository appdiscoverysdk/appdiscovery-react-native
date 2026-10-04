import { AppDiscoveryOfferwallConfig, AppDiscoveryReward } from "./types";
/**
 * A configured offerwall that can be shown, mirroring the `Offerwall` object of
 * the native SDKs. Create one with `AppDiscovery.create`.
 */
export declare class OfferwallInstance {
    /** Normalised host of the offerwall. */
    readonly host: string;
    /** Normalised tracker host, or undefined when it is the offerwall host. */
    readonly trackerHost?: string;
    appId: string;
    sdkKey: string;
    playerId: string;
    onReward?: (reward: AppDiscoveryReward) => void;
    onClose?: () => void;
    private unsubReward;
    private unsubClose;
    /** @throws Error when `host` (or `trackerHost`) is not a valid host. */
    constructor(host: string, appId: string, sdkKey: string, playerId: string, trackerHost?: string);
    getConfig(): AppDiscoveryOfferwallConfig;
    /** Shows the offerwall. Resolves `false` when the platform could not present it. */
    show(): Promise<boolean>;
    private removeListeners;
}
