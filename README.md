# AppDiscovery SDK for React Native

A React Native module that adds an offerwall to your Android and iOS app. Your users earn rewards by completing offers, and your app is notified through simple callbacks.

The SDK is configured with the host of your own offerwall (given to you by the network you publish for). There is no default host.

## Requirements

| Requirement | Version |
|---|---|
| React Native | 0.64+ (old and new architecture, through the interop layer) |
| Expo | Bare React Native or a development build (prebuild); Expo Go is not supported because the module is native |
| Android minSdk | 21, Java 17 |
| iOS deployment target | 13.0+ |

## Installation

From the GitHub release (an `npm pack` tarball):

```bash
npm install https://github.com/appdiscoverysdk/appdiscovery-react-native/releases/download/1.0.0/appdiscovery-react-native-1.0.0.tgz
```

or straight from the repository tag:

```bash
npm install github:appdiscoverysdk/appdiscovery-react-native#1.0.0
```

Publishing to the npm registry (`npm install appdiscovery-react-native`) will follow.

### iOS

Install the pods. The native iOS SDK is bundled with the package.

```bash
cd ios && pod install && cd ..
```

### Android

The native SDK is served from JitPack; the module adds the repository itself. If your build declares repositories centrally with `FAIL_ON_PROJECT_REPOS`, add JitPack to `android/build.gradle`:

```groovy
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url "https://jitpack.io" }
    }
}
```

The permissions (`INTERNET`, `ACCESS_NETWORK_STATE`, `AD_ID`) and the offerwall activity are merged automatically.

## Quick start

```tsx
import { AppDiscovery } from "appdiscovery-react-native";

await AppDiscovery.init({
  host: "offers.example.com",   // Host of your offerwall (required)
  appId: "YOUR_APP_ID",
  sdkKey: "YOUR_SDK_KEY",
  playerId: "player_123",       // Unique id of the player in your app
});

const offReward = AppDiscovery.onReward((reward) => {
  console.log("Reward", reward.amount, "transaction", reward.txid);
});
const offClose = AppDiscovery.onClose(() => console.log("Offerwall closed"));

await AppDiscovery.showOfferwall();

// when your component unmounts
offReward();
offClose();
```

Or create a self-contained instance, like the native `AppDiscovery.create`:

```tsx
const offerwall = AppDiscovery.create("offers.example.com", "YOUR_APP_ID", "YOUR_SDK_KEY", "player_123");
offerwall.onReward = (reward) => console.log(reward.amount);
offerwall.onClose = () => console.log("closed");
await offerwall.show();
```

## API

### AppDiscovery

| Member | Description |
|---|---|
| `init({ host, appId, sdkKey, playerId?, trackerHost? })` | Stores the configuration (a positional form `init(host, appId, sdkKey, playerId?, trackerHost?)` exists too). `host` is a plain host name (an `https://` URL is accepted). Rejects with an `Error` when it is missing or invalid. `trackerHost` is only needed when reward sync runs on a different host. |
| `create(host, appId, sdkKey, playerId, trackerHost?)` | Returns an `OfferwallInstance`. Throws when the host is invalid. |
| `setUserId(playerId)` | Changes the active player, for example after a login. |
| `showOfferwall(options?)` | Shows the offerwall. Values you leave out of `options` (`host`, `trackerHost`, `appId`, `sdkKey`, `playerId`) come from `init`. Resolves `false` when `appId` or `sdkKey` is missing or the platform could not present it. |
| `syncPendingRewards(options?)` | Delivers rewards earned while the app was closed and resolves with them. |
| `onReward(callback)` / `onClose(callback)` | Return a function that removes the listener. |
| `removeAllListeners()` | Removes every listener. |
| `getHost()`, `getTrackerHost()`, `getAppId()`, `getSdkKey()`, `getPlayerId()`, `isInitialized()` | Read the stored configuration. |

### AppDiscoveryReward

| Field | Description |
|---|---|
| `amount` | Reward amount |
| `txid` | Unique transaction id, use it to avoid crediting twice |
| `status` | `approved`, `pending`, `reversed` or `rejected` |
| `player_id`, `publisher_id`, `timestamp`, `type` | Optional metadata |
| any other key | Additional parameters sent by the server are preserved |

## Troubleshooting

- **`host is required` / `host must be ...`:** `host` must be a plain host name such as `offers.example.com` (or an `https://` URL). Cleartext `http://` is rejected.
- **`Native module 'AppDiscoveryModule' is not linked`:** rebuild the native app after installing (`pod install`, then run again). Expo Go cannot load native modules.
- **Zero offers shown:** check that the application id matches the one registered for your `appId`, that `appId`, `sdkKey` and `host` are correct, and that `playerId` is not empty.

## License

MIT, see [LICENSE](LICENSE).
