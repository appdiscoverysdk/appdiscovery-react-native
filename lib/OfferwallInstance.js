"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfferwallInstance = void 0;
const AppDiscovery_1 = require("./AppDiscovery");
const host_1 = require("./host");
/**
 * A configured offerwall that can be shown, mirroring the `Offerwall` object of
 * the native SDKs. Create one with `AppDiscovery.create`.
 */
class OfferwallInstance {
    /** @throws Error when `host` (or `trackerHost`) is not a valid host. */
    constructor(host, appId, sdkKey, playerId, trackerHost) {
        this.unsubReward = null;
        this.unsubClose = null;
        this.host = (0, host_1.normalizeHost)(host);
        this.trackerHost = (0, host_1.normalizeOptionalHost)(trackerHost, "trackerHost");
        this.appId = appId;
        this.sdkKey = sdkKey;
        this.playerId = playerId;
    }
    getConfig() {
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
    async show() {
        this.removeListeners();
        if (this.onReward) {
            this.unsubReward = AppDiscovery_1.AppDiscovery.onReward((reward) => {
                if (this.onReward) {
                    this.onReward(reward);
                }
            });
        }
        if (this.onClose) {
            this.unsubClose = AppDiscovery_1.AppDiscovery.onClose(() => {
                if (this.onClose) {
                    this.onClose();
                }
                this.removeListeners();
            });
        }
        return AppDiscovery_1.AppDiscovery.showOfferwall({
            host: this.host,
            trackerHost: this.trackerHost,
            appId: this.appId,
            sdkKey: this.sdkKey,
            playerId: this.playerId,
        });
    }
    removeListeners() {
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
exports.OfferwallInstance = OfferwallInstance;
