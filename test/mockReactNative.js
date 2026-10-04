'use strict';
// A stand-in for "react-native" so the compiled SDK can run under plain Node.
const Module = require('module');

const listeners = {};
const nativeCalls = [];
const handlers = {};

const AppDiscoveryModule = {
  initSDK: async (...args) => { nativeCalls.push(['initSDK', ...args]); return handlers.initSDK ? handlers.initSDK(...args) : true; },
  setUserId: async (...args) => { nativeCalls.push(['setUserId', ...args]); return true; },
  showOfferwall: async (...args) => { nativeCalls.push(['showOfferwall', ...args]); return handlers.showOfferwall ? handlers.showOfferwall(...args) : true; },
  syncPendingRewards: async (...args) => { nativeCalls.push(['syncPendingRewards', ...args]); return handlers.syncPendingRewards ? handlers.syncPendingRewards(...args) : []; },
};

const state = { NativeModules: { AppDiscoveryModule } };

class NativeEventEmitter {
  constructor(nativeModule) {
    if (!nativeModule) throw new Error('NativeEventEmitter needs a native module');
  }
  addListener(name, cb) {
    (listeners[name] = listeners[name] || []).push(cb);
    return { remove() { listeners[name] = (listeners[name] || []).filter((l) => l !== cb); } };
  }
}

const mock = {
  get NativeModules() { return state.NativeModules; },
  NativeEventEmitter,
};

const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'react-native') return mock;
  return originalLoad.apply(this, arguments);
};

module.exports = {
  emit(name, payload) { (listeners[name] || []).slice().forEach((cb) => cb(payload)); },
  listenerCount(name) { return (listeners[name] || []).length; },
  calls: nativeCalls,
  reset() {
    nativeCalls.length = 0;
    for (const k of Object.keys(listeners)) delete listeners[k];
    for (const k of Object.keys(handlers)) delete handlers[k];
    state.NativeModules = { AppDiscoveryModule };
  },
  on(method, fn) { handlers[method] = fn; },
  unlink() { state.NativeModules = {}; },
};
