package com.appdiscoverysdk.reactnative

import com.appdiscoverysdk.AppDiscovery
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject

/**
 * Bridges React Native calls to the AppDiscovery Android SDK.
 *
 * The offerwall host is a required setting: there is no default.
 */
class AppDiscoveryModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    // Configuration remembered from initSDK / setUserId, used when a call omits a value.
    private var activeHost: String = ""
    private var activeTrackerHost: String? = null
    private var activeAppId: String = ""
    private var activeSdkKey: String = ""
    private var activePlayerId: String = ""

    override fun getName(): String = "AppDiscoveryModule"

    @ReactMethod
    fun initSDK(host: String?, appId: String?, sdkKey: String?, options: ReadableMap?, promise: Promise) {
        activeHost = clean(host)
        activeAppId = clean(appId)
        activeSdkKey = clean(sdkKey)
        activePlayerId = clean(options?.takeIf { it.hasKey("playerId") }?.getString("playerId"))
        activeTrackerHost = clean(options?.takeIf { it.hasKey("trackerHost") }?.getString("trackerHost")).ifEmpty { null }
        promise.resolve(true)
    }

    @ReactMethod
    fun setUserId(playerId: String?, promise: Promise) {
        activePlayerId = clean(playerId)
        promise.resolve(true)
    }

    @ReactMethod
    fun showOfferwall(
        host: String?,
        appId: String?,
        sdkKey: String?,
        playerId: String?,
        trackerHost: String?,
        promise: Promise
    ) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject("ACTIVITY_NOT_FOUND", "Current Activity does not exist")
            return
        }

        val config = resolve(host, appId, sdkKey, playerId, trackerHost)
        if (config.appId.isEmpty() || config.sdkKey.isEmpty()) {
            promise.reject("INVALID_CONFIG", "appId and sdkKey must be provided")
            return
        }

        try {
            val offerwall = AppDiscovery.create(
                host = config.host,
                appId = config.appId,
                sdkKey = config.sdkKey,
                playerId = config.playerId,
                trackerHost = config.trackerHost
            )

            offerwall.onReward = { reward ->
                sendEvent(EVENT_ON_REWARD, toWritableMap(reward))
            }

            offerwall.onClose = {
                sendEvent(EVENT_ON_CLOSE, null)
            }

            offerwall.launch(activity)
            promise.resolve(true)
        } catch (e: IllegalArgumentException) {
            promise.reject("INVALID_HOST", e.message, e)
        } catch (e: Exception) {
            promise.reject("APPDISCOVERY_SDK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun syncPendingRewards(
        host: String?,
        appId: String?,
        sdkKey: String?,
        playerId: String?,
        trackerHost: String?,
        promise: Promise
    ) {
        val config = resolve(host, appId, sdkKey, playerId, trackerHost)
        try {
            AppDiscovery.syncPendingRewards(
                host = config.host,
                appId = config.appId,
                sdkKey = config.sdkKey,
                playerId = config.playerId,
                trackerHost = config.trackerHost
            ) { rewards ->
                val array = Arguments.createArray()
                for (reward in rewards) {
                    array.pushMap(toWritableMap(reward))
                }
                promise.resolve(array)
            }
        } catch (e: IllegalArgumentException) {
            promise.reject("INVALID_HOST", e.message, e)
        } catch (e: Exception) {
            promise.reject("APPDISCOVERY_SDK_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN NativeEventEmitter
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN NativeEventEmitter
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        }
    }

    // --- helpers ---------------------------------------------------------------

    private class Resolved(
        val host: String,
        val trackerHost: String?,
        val appId: String,
        val sdkKey: String,
        val playerId: String
    )

    private fun resolve(
        host: String?,
        appId: String?,
        sdkKey: String?,
        playerId: String?,
        trackerHost: String?
    ): Resolved {
        val hostArg = clean(host)
        // The remembered tracker host belongs to the remembered host only.
        val tracker = clean(trackerHost).ifEmpty { if (hostArg.isEmpty()) activeTrackerHost else null }
        return Resolved(
            host = hostArg.ifEmpty { activeHost },
            trackerHost = tracker,
            appId = clean(appId).ifEmpty { activeAppId },
            sdkKey = clean(sdkKey).ifEmpty { activeSdkKey },
            playerId = clean(playerId).ifEmpty { activePlayerId }
        )
    }

    private fun clean(value: String?): String {
        val trimmed = value?.trim().orEmpty()
        return if (trimmed == "undefined") "" else trimmed
    }

    /** Reward payloads come from JSON; reduce them to what the React Native bridge accepts. */
    private fun toWritableMap(source: Map<String, Any?>): WritableMap {
        val plain = HashMap<String, Any?>()
        for ((key, value) in source) {
            plain[key] = toPlain(value)
        }
        return Arguments.makeNativeMap(plain)
    }

    private fun toPlain(value: Any?): Any? = when (value) {
        null, JSONObject.NULL -> null
        is Boolean, is String -> value
        is Number -> value.toDouble()
        is JSONObject -> {
            val map = HashMap<String, Any?>()
            val keys = value.keys()
            while (keys.hasNext()) {
                val k = keys.next()
                map[k] = toPlain(value.opt(k))
            }
            map
        }
        is JSONArray -> (0 until value.length()).map { toPlain(value.opt(it)) }
        is Map<*, *> -> value.entries.associate { it.key.toString() to toPlain(it.value) }
        is Iterable<*> -> value.map { toPlain(it) }
        else -> value.toString()
    }

    companion object {
        const val EVENT_ON_REWARD = "onAppDiscoveryReward"
        const val EVENT_ON_CLOSE = "onAppDiscoveryClose"
    }
}
