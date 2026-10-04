'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const rn = require('./mockReactNative');
const { AppDiscovery, AppDiscoveryOfferwall, OfferwallInstance } = require('../lib');

const quiet = () => {
  const noop = () => {};
  console.warn = noop;
  console.error = noop;
};
quiet();

test.beforeEach(() => {
  rn.reset();
  AppDiscovery.resetForTesting();
});

test('init requires a host: there is no default', async () => {
  await assert.rejects(AppDiscovery.init({ host: '', appId: 'a', sdkKey: 'k' }), /host is required/);
  await assert.rejects(AppDiscovery.init({ host: 'http://offers.example.com', appId: 'a', sdkKey: 'k' }), /https/);
  assert.equal(AppDiscovery.isInitialized(), false);
  assert.equal(rn.calls.length, 0);
});

test('init stores the configuration and hands the normalised host to the native module', async () => {
  const ok = await AppDiscovery.init({
    host: 'HTTPS://Offers.Example.com/',
    trackerHost: 'track.example.com',
    appId: ' app1 ',
    sdkKey: 'key1',
    playerId: 'player1',
  });
  assert.equal(ok, true);
  assert.equal(AppDiscovery.getHost(), 'offers.example.com');
  assert.equal(AppDiscovery.getTrackerHost(), 'track.example.com');
  assert.equal(AppDiscovery.getAppId(), 'app1');
  assert.equal(AppDiscovery.getPlayerId(), 'player1');
  assert.equal(AppDiscovery.isInitialized(), true);
  assert.deepEqual(rn.calls[0], [
    'initSDK', 'offers.example.com', 'app1', 'key1', { playerId: 'player1', trackerHost: 'track.example.com' },
  ]);
});

test('init accepts positional arguments as well', async () => {
  await AppDiscovery.init('offers.example.com', 'a', 'k', 'p');
  assert.equal(AppDiscovery.getHost(), 'offers.example.com');
  assert.equal(AppDiscovery.getPlayerId(), 'p');
});

test('showOfferwall uses the values from init', async () => {
  await AppDiscovery.init({ host: 'offers.example.com', appId: 'a', sdkKey: 'k', playerId: 'p' });
  rn.calls.length = 0;
  assert.equal(await AppDiscovery.showOfferwall(), true);
  assert.deepEqual(rn.calls[0], ['showOfferwall', 'offers.example.com', 'a', 'k', 'p', '']);
});

test('per-call values override the stored ones and a different host does not inherit the tracker host', async () => {
  await AppDiscovery.init({ host: 'offers.example.com', trackerHost: 'track.example.com', appId: 'a', sdkKey: 'k', playerId: 'p' });
  rn.calls.length = 0;
  await AppDiscovery.showOfferwall({ host: 'other.example.com', playerId: 'p2' });
  assert.deepEqual(rn.calls[0], ['showOfferwall', 'other.example.com', 'a', 'k', 'p2', '']);
  rn.calls.length = 0;
  await AppDiscovery.showOfferwall({ playerId: 'p3' });
  assert.deepEqual(rn.calls[0], ['showOfferwall', 'offers.example.com', 'a', 'k', 'p3', 'track.example.com']);
});

test('showOfferwall rejects instead of guessing a host', async () => {
  await assert.rejects(AppDiscovery.showOfferwall({ appId: 'a', sdkKey: 'k', playerId: 'p' }), /host is required/);
  assert.equal(rn.calls.length, 0);
});

test('showOfferwall resolves false without appId or sdkKey', async () => {
  assert.equal(await AppDiscovery.showOfferwall({ host: 'offers.example.com', playerId: 'p' }), false);
  assert.equal(rn.calls.length, 0);
});

test('showOfferwall resolves false when the native module is not linked or fails', async () => {
  rn.unlink();
  assert.equal(await AppDiscovery.showOfferwall({ host: 'offers.example.com', appId: 'a', sdkKey: 'k', playerId: 'p' }), false);
  rn.reset();
  rn.on('showOfferwall', () => { throw new Error('INVALID_HOST'); });
  assert.equal(await AppDiscovery.showOfferwall({ host: 'offers.example.com', appId: 'a', sdkKey: 'k', playerId: 'p' }), false);
});

test('setUserId updates the player and calls the native module', async () => {
  await AppDiscovery.setUserId(' new_player ');
  assert.equal(AppDiscovery.getPlayerId(), 'new_player');
  assert.deepEqual(rn.calls[0], ['setUserId', 'new_player']);
});

test('syncPendingRewards returns what the native module found and needs a player id', async () => {
  rn.on('syncPendingRewards', () => [{ txid: 't1', amount: 5 }]);
  const rewards = await AppDiscovery.syncPendingRewards({ host: 'offers.example.com', appId: 'a', sdkKey: 'k', playerId: 'p' });
  assert.equal(rewards[0].txid, 't1');
  rn.calls.length = 0;
  assert.deepEqual(await AppDiscovery.syncPendingRewards({ host: 'offers.example.com', appId: 'a', sdkKey: 'k' }), []);
  assert.equal(rn.calls.length, 0);
});

test('create validates the host and keeps the configuration', () => {
  assert.throws(() => AppDiscovery.create('', 'a', 'k', 'p'), /host is required/);
  const offerwall = AppDiscovery.create('Offers.Example.com', 'app1', 'key1', 'user1', 'track.example.com');
  assert.ok(offerwall instanceof OfferwallInstance);
  assert.equal(offerwall.host, 'offers.example.com');
  assert.equal(offerwall.trackerHost, 'track.example.com');
  assert.equal(offerwall.getConfig().host, 'offers.example.com');
  const viaFactory = AppDiscoveryOfferwall.create('offers.example.com', 'a', 'k', 'p');
  assert.equal(viaFactory.trackerHost, undefined);
});

test('an instance delivers rewards and stops listening after the offerwall closed', async () => {
  const received = [];
  let closed = 0;
  const offerwall = AppDiscovery.create('offers.example.com', 'a', 'k', 'p');
  offerwall.onReward = (r) => received.push(r.txid);
  offerwall.onClose = () => { closed += 1; };

  assert.equal(await offerwall.show(), true);
  assert.deepEqual(rn.calls.at(-1), ['showOfferwall', 'offers.example.com', 'a', 'k', 'p', '']);

  rn.emit('onAppDiscoveryReward', { txid: 'a', amount: 1 });
  rn.emit('onAppDiscoveryClose');
  rn.emit('onAppDiscoveryReward', { txid: 'b', amount: 1 });
  assert.deepEqual(received, ['a']);
  assert.equal(closed, 1);
});

test('listeners are removed in bulk and a throwing listener does not break the others', () => {
  const got = [];
  AppDiscovery.onReward(() => { throw new Error('boom'); });
  const off = AppDiscovery.onReward((r) => got.push(r.txid));
  rn.emit('onAppDiscoveryReward', { txid: 'x' });
  off();
  rn.emit('onAppDiscoveryReward', { txid: 'y' });
  assert.deepEqual(got, ['x']);

  AppDiscovery.removeAllListeners();
  assert.equal(rn.listenerCount('onAppDiscoveryReward'), 0);
});

test('native event names are neutral', async () => {
  AppDiscovery.onReward(() => {});
  AppDiscovery.onClose(() => {});
  assert.equal(rn.listenerCount('onAppDiscoveryReward'), 1);
  assert.equal(rn.listenerCount('onAppDiscoveryClose'), 1);
});
