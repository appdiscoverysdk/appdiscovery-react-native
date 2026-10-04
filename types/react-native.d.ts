// Minimal typings of the parts of "react-native" this package uses, so the
// package builds without installing React Native itself. Consumer apps type
// against the real react-native typings; this file is not published.
declare module "react-native" {
  export interface EmitterSubscription {
    remove(): void;
  }

  export class NativeEventEmitter {
    constructor(nativeModule?: any);
    addListener(eventType: string, listener: (...args: any[]) => any): EmitterSubscription;
  }

  export const NativeModules: { [name: string]: any };
}

// React Native provides the console at runtime.
declare const console: {
  log(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
};
