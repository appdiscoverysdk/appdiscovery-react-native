#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(AppDiscoveryModule, RCTEventEmitter)

RCT_EXTERN_METHOD(initSDK:(NSString *)host
                  appId:(NSString *)appId
                  sdkKey:(NSString *)sdkKey
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(setUserId:(NSString *)playerId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(showOfferwall:(NSString *)host
                  appId:(NSString *)appId
                  sdkKey:(NSString *)sdkKey
                  playerId:(NSString *)playerId
                  trackerHost:(NSString *)trackerHost
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(syncPendingRewards:(NSString *)host
                  appId:(NSString *)appId
                  sdkKey:(NSString *)sdkKey
                  playerId:(NSString *)playerId
                  trackerHost:(NSString *)trackerHost
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
