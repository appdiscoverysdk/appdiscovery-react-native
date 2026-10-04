import Foundation
import UIKit
import React
import AppDiscoverySDK

/// Bridges React Native calls to the AppDiscovery iOS SDK.
///
/// The offerwall host is a required setting: there is no default.
@objc(AppDiscoveryModule)
class AppDiscoveryModule: RCTEventEmitter {

  private var hasListeners = false

  // Configuration remembered from initSDK / setUserId, used when a call omits a value.
  private var activeHost = ""
  private var activeTrackerHost: String?
  private var activeAppId = ""
  private var activeSdkKey = ""
  private var activePlayerId = ""

  override class func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func supportedEvents() -> [String]! {
    return ["onAppDiscoveryReward", "onAppDiscoveryClose"]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  private func emitReward(_ data: [String: Any]) {
    if hasListeners {
      sendEvent(withName: "onAppDiscoveryReward", body: data)
    }
  }

  private func emitClose() {
    if hasListeners {
      sendEvent(withName: "onAppDiscoveryClose", body: nil)
    }
  }

  // MARK: - Calls

  @objc(initSDK:appId:sdkKey:options:resolver:rejecter:)
  func initSDK(
    host: String?,
    appId: String?,
    sdkKey: String?,
    options: [String: Any]?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    activeHost = clean(host)
    activeAppId = clean(appId)
    activeSdkKey = clean(sdkKey)
    activePlayerId = clean(options?["playerId"] as? String)
    let tracker = clean(options?["trackerHost"] as? String)
    activeTrackerHost = tracker.isEmpty ? nil : tracker
    resolve(true)
  }

  @objc(setUserId:resolver:rejecter:)
  func setUserId(
    playerId: String?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    activePlayerId = clean(playerId)
    resolve(true)
  }

  @objc(showOfferwall:appId:sdkKey:playerId:trackerHost:resolver:rejecter:)
  func showOfferwall(
    host: String?,
    appId: String?,
    sdkKey: String?,
    playerId: String?,
    trackerHost: String?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      guard let topVC = self.topViewController() else {
        reject("NO_VIEW_CONTROLLER", "Unable to find a view controller to present the offerwall", nil)
        return
      }

      let config = self.resolveConfig(host, appId, sdkKey, playerId, trackerHost)
      if config.appId.isEmpty || config.sdkKey.isEmpty {
        reject("INVALID_CONFIG", "appId and sdkKey must be provided", nil)
        return
      }

      do {
        let offerwall = try AppDiscovery.create(
          host: config.host,
          appId: config.appId,
          sdkKey: config.sdkKey,
          playerId: config.playerId,
          trackerHost: config.trackerHost
        )

        offerwall.onReward = { [weak self] reward in
          self?.emitReward(AppDiscoveryModule.compact(reward))
        }

        offerwall.onClose = { [weak self] in
          self?.emitClose()
        }

        offerwall.launch(viewController: topVC)
        resolve(true)
      } catch let error as AppDiscoveryError {
        reject("INVALID_HOST", error.localizedDescription, error)
      } catch {
        reject("APPDISCOVERY_SDK_ERROR", error.localizedDescription, error)
      }
    }
  }

  @objc(syncPendingRewards:appId:sdkKey:playerId:trackerHost:resolver:rejecter:)
  func syncPendingRewards(
    host: String?,
    appId: String?,
    sdkKey: String?,
    playerId: String?,
    trackerHost: String?,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let config = resolveConfig(host, appId, sdkKey, playerId, trackerHost)
    do {
      try AppDiscovery.syncPendingRewards(
        host: config.host,
        appId: config.appId,
        sdkKey: config.sdkKey,
        playerId: config.playerId,
        trackerHost: config.trackerHost
      ) { rewards in
        resolve(rewards.map { AppDiscoveryModule.compact($0) })
      }
    } catch let error as AppDiscoveryError {
      reject("INVALID_HOST", error.localizedDescription, error)
    } catch {
      reject("APPDISCOVERY_SDK_ERROR", error.localizedDescription, error)
    }
  }

  // MARK: - Helpers

  private struct ResolvedConfig {
    let host: String
    let trackerHost: String?
    let appId: String
    let sdkKey: String
    let playerId: String
  }

  private func resolveConfig(
    _ host: String?,
    _ appId: String?,
    _ sdkKey: String?,
    _ playerId: String?,
    _ trackerHost: String?
  ) -> ResolvedConfig {
    let hostArg = clean(host)
    // The remembered tracker host belongs to the remembered host only.
    let trackerArg = clean(trackerHost)
    let tracker: String? = trackerArg.isEmpty ? (hostArg.isEmpty ? activeTrackerHost : nil) : trackerArg
    return ResolvedConfig(
      host: hostArg.isEmpty ? activeHost : hostArg,
      trackerHost: tracker,
      appId: firstNonEmpty(clean(appId), activeAppId),
      sdkKey: firstNonEmpty(clean(sdkKey), activeSdkKey),
      playerId: firstNonEmpty(clean(playerId), activePlayerId)
    )
  }

  private func clean(_ value: String?) -> String {
    let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    return trimmed == "undefined" ? "" : trimmed
  }

  private func firstNonEmpty(_ preferred: String, _ fallback: String) -> String {
    return preferred.isEmpty ? fallback : preferred
  }

  /// Drops nil values so the payload can cross the bridge.
  private static func compact(_ reward: [String: Any?]) -> [String: Any] {
    var out: [String: Any] = [:]
    for (key, value) in reward {
      if let value = value {
        out[key] = value
      }
    }
    return out
  }

  private func topViewController() -> UIViewController? {
    let root = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first(where: { $0.isKeyWindow })?.rootViewController
    return top(of: root)
  }

  private func top(of viewController: UIViewController?) -> UIViewController? {
    if let nav = viewController as? UINavigationController {
      return top(of: nav.visibleViewController) ?? nav
    }
    if let tab = viewController as? UITabBarController {
      return top(of: tab.selectedViewController) ?? tab
    }
    if let presented = viewController?.presentedViewController {
      return top(of: presented)
    }
    return viewController
  }
}
