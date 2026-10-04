"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDiscoveryOfferwall = void 0;
const AppDiscovery_1 = require("./AppDiscovery");
const OfferwallInstance_1 = require("./OfferwallInstance");
/** Factory helpers for offerwalls that carry their own configuration. */
class AppDiscoveryOfferwall {
    /**
     * Creates a new offerwall instance, like the native `AppDiscovery.create`.
     * @throws Error when `host` (or `trackerHost`) is not a valid host.
     */
    static create(host, appId, sdkKey, playerId, trackerHost) {
        return new OfferwallInstance_1.OfferwallInstance(host, appId, sdkKey, playerId, trackerHost);
    }
    /** Shows the native offerwall directly. */
    static async showOfferwall(host, appId, sdkKey, playerId, trackerHost) {
        return AppDiscovery_1.AppDiscovery.showOfferwall({ host, appId, sdkKey, playerId, trackerHost });
    }
}
exports.AppDiscoveryOfferwall = AppDiscoveryOfferwall;
