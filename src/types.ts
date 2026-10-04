/** A reward event received from the offerwall. */
export interface AppDiscoveryReward {
  amount?: number;
  /** Unique transaction id. Use it to avoid crediting twice. */
  txid?: string;
  /** `approved`, `pending`, `reversed` or `rejected`. */
  status?: string;
  publisher_id?: number;
  player_id?: string;
  timestamp?: number;
  type?: string;
  /** Any additional parameter sent by the server is preserved. */
  [key: string]: any;
}

/** Configuration for `AppDiscovery.init`. */
export interface AppDiscoveryInitConfig {
  /**
   * Host of your offerwall web app, for example `offers.example.com`
   * (an `https://` URL is accepted). Required, there is no default.
   */
  host: string;
  /** Host of the tracker, when reward sync runs on a different host. Defaults to `host`. */
  trackerHost?: string;
  /** Your app ID from the dashboard. */
  appId: string;
  /** Your SDK key from the dashboard. */
  sdkKey: string;
  /** Unique id of the player. Can be set later with `setUserId`. */
  playerId?: string;
}

/** Configuration of one `OfferwallInstance`. */
export interface AppDiscoveryOfferwallConfig extends AppDiscoveryInitConfig {
  playerId: string;
  onReward?: (reward: AppDiscoveryReward) => void;
  onClose?: () => void;
}

/** Optional per-call overrides for `AppDiscovery.showOfferwall`. */
export interface AppDiscoveryOfferwallOptions {
  host?: string;
  trackerHost?: string;
  appId?: string;
  sdkKey?: string;
  playerId?: string;
}
