"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDiscovery = void 0;
const react_native_1 = require("react-native");
const host_1 = require("./host");
const OfferwallInstance_1 = require("./OfferwallInstance");
const REWARD_EVENT = "onAppDiscoveryReward";
const CLOSE_EVENT = "onAppDiscoveryClose";
function nativeModule() {
    return react_native_1.NativeModules.AppDiscoveryModule;
}
let emitter = null;
function getEventEmitter() {
    const native = nativeModule();
    if (!emitter && native) {
        try {
            emitter = new react_native_1.NativeEventEmitter(native);
        }
        catch (e) {
            console.warn("[AppDiscovery SDK] Failed to initialize NativeEventEmitter:", e);
        }
    }
    return emitter;
}
function firstNonEmpty(preferred, fallback) {
    const p = (preferred !== null && preferred !== void 0 ? preferred : "").trim();
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
class AppDiscovery {
    static async init(configOrHost, appId, sdkKey, playerId, trackerHost) {
        const config = typeof configOrHost === "object"
            ? configOrHost
            : { host: configOrHost, appId: appId !== null && appId !== void 0 ? appId : "", sdkKey: sdkKey !== null && sdkKey !== void 0 ? sdkKey : "", playerId, trackerHost };
        const host = (0, host_1.normalizeHost)(config.host);
        const tracker = (0, host_1.normalizeOptionalHost)(config.trackerHost, "trackerHost");
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
                    trackerHost: tracker !== null && tracker !== void 0 ? tracker : "",
                });
            }
            catch (err) {
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
    static create(host, appId, sdkKey, playerId, trackerHost) {
        return new OfferwallInstance_1.OfferwallInstance(host, appId, sdkKey, playerId, trackerHost);
    }
    /** Updates the active player / user id. */
    static async setUserId(playerId) {
        AppDiscovery.playerId = (playerId || "").trim();
        const native = nativeModule();
        if (native && typeof native.setUserId === "function") {
            try {
                await native.setUserId(AppDiscovery.playerId);
            }
            catch (err) {
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
    static async showOfferwall(options) {
        var _a, _b;
        const hostArg = ((_a = options === null || options === void 0 ? void 0 : options.host) !== null && _a !== void 0 ? _a : "").trim();
        const host = (0, host_1.normalizeHost)(firstNonEmpty(options === null || options === void 0 ? void 0 : options.host, AppDiscovery.host));
        // The stored tracker host belongs to the stored host only.
        const tracker = (_b = (0, host_1.normalizeOptionalHost)(options === null || options === void 0 ? void 0 : options.trackerHost, "trackerHost")) !== null && _b !== void 0 ? _b : (hostArg.length === 0 ? AppDiscovery.trackerHost : undefined);
        const appId = firstNonEmpty(options === null || options === void 0 ? void 0 : options.appId, AppDiscovery.appId);
        const sdkKey = firstNonEmpty(options === null || options === void 0 ? void 0 : options.sdkKey, AppDiscovery.sdkKey);
        const playerId = firstNonEmpty(options === null || options === void 0 ? void 0 : options.playerId, AppDiscovery.playerId);
        if (!appId || !sdkKey) {
            console.error("[AppDiscovery SDK] Error: appId and sdkKey are required before showing the offerwall.");
            return false;
        }
        if (!playerId) {
            console.warn("[AppDiscovery SDK] Warning: playerId is empty. Make sure the user is logged in or the playerId is set.");
        }
        const native = nativeModule();
        if (!native) {
            console.warn("[AppDiscovery SDK] Native module 'AppDiscoveryModule' is not linked. Please ensure native modules are installed.");
            return false;
        }
        AppDiscovery.setupNativeEventListeners();
        try {
            return await native.showOfferwall(host, appId, sdkKey, playerId, tracker !== null && tracker !== void 0 ? tracker : "");
        }
        catch (err) {
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
    static async syncPendingRewards(options) {
        var _a, _b;
        const hostArg = ((_a = options === null || options === void 0 ? void 0 : options.host) !== null && _a !== void 0 ? _a : "").trim();
        const host = (0, host_1.normalizeHost)(firstNonEmpty(options === null || options === void 0 ? void 0 : options.host, AppDiscovery.host));
        const tracker = (_b = (0, host_1.normalizeOptionalHost)(options === null || options === void 0 ? void 0 : options.trackerHost, "trackerHost")) !== null && _b !== void 0 ? _b : (hostArg.length === 0 ? AppDiscovery.trackerHost : undefined);
        const appId = firstNonEmpty(options === null || options === void 0 ? void 0 : options.appId, AppDiscovery.appId);
        const sdkKey = firstNonEmpty(options === null || options === void 0 ? void 0 : options.sdkKey, AppDiscovery.sdkKey);
        const playerId = firstNonEmpty(options === null || options === void 0 ? void 0 : options.playerId, AppDiscovery.playerId);
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
            const rewards = await native.syncPendingRewards(host, appId, sdkKey, playerId, tracker !== null && tracker !== void 0 ? tracker : "");
            return Array.isArray(rewards) ? rewards : [];
        }
        catch (err) {
            console.error("[AppDiscovery SDK] Failed to sync pending rewards:", err);
            return [];
        }
    }
    /** Subscribes to reward events. Returns a function that removes the listener. */
    static onReward(callback) {
        AppDiscovery.rewardListeners.add(callback);
        AppDiscovery.setupNativeEventListeners();
        return () => {
            AppDiscovery.rewardListeners.delete(callback);
        };
    }
    /** Subscribes to offerwall close events. Returns a function that removes the listener. */
    static onClose(callback) {
        AppDiscovery.closeListeners.add(callback);
        AppDiscovery.setupNativeEventListeners();
        return () => {
            AppDiscovery.closeListeners.delete(callback);
        };
    }
    /** Updates stored configuration at runtime. A new `host` or `trackerHost` is validated like in `init`. */
    static setConfig(config) {
        if (config.host !== undefined)
            AppDiscovery.host = (0, host_1.normalizeHost)(config.host);
        if (config.trackerHost !== undefined) {
            AppDiscovery.trackerHost = (0, host_1.normalizeOptionalHost)(config.trackerHost, "trackerHost");
        }
        if (config.appId !== undefined)
            AppDiscovery.appId = (config.appId || "").trim();
        if (config.sdkKey !== undefined)
            AppDiscovery.sdkKey = (config.sdkKey || "").trim();
        if (config.playerId !== undefined)
            void AppDiscovery.setUserId(config.playerId || "");
    }
    /** The configured offerwall host (empty before `init`). */
    static getHost() {
        return AppDiscovery.host;
    }
    /** The configured tracker host, or undefined when it is the offerwall host. */
    static getTrackerHost() {
        return AppDiscovery.trackerHost;
    }
    static getAppId() {
        return AppDiscovery.appId;
    }
    static getSdkKey() {
        return AppDiscovery.sdkKey;
    }
    static getPlayerId() {
        return AppDiscovery.playerId;
    }
    /** Whether `init` has been called. */
    static isInitialized() {
        return AppDiscovery.initialized;
    }
    static setupNativeEventListeners() {
        const em = getEventEmitter();
        if (!em)
            return;
        if (!AppDiscovery.rewardSubscription) {
            AppDiscovery.rewardSubscription = em.addListener(REWARD_EVENT, (reward) => {
                AppDiscovery.rewardListeners.forEach((listener) => {
                    try {
                        listener(reward);
                    }
                    catch (e) {
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
                    }
                    catch (e) {
                        console.error("[AppDiscovery SDK] Exception in onClose listener:", e);
                    }
                });
            });
        }
    }
    /** Removes every listener added with `onReward` and `onClose`. */
    static removeAllListeners() {
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
    static resetForTesting() {
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
exports.AppDiscovery = AppDiscovery;
AppDiscovery.host = "";
AppDiscovery.trackerHost = undefined;
AppDiscovery.appId = "";
AppDiscovery.sdkKey = "";
AppDiscovery.playerId = "";
AppDiscovery.initialized = false;
AppDiscovery.rewardListeners = new Set();
AppDiscovery.closeListeners = new Set();
AppDiscovery.rewardSubscription = null;
AppDiscovery.closeSubscription = null;
