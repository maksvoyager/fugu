import assert from 'node:assert/strict';

// Проверяем отсутствие native-вызовов в браузере и единственный комплект Android listener.
globalThis.window = {};
globalThis.document = { documentElement: { classList: { add() {} } } };
const browser = await import('../src/native-app.js?test=browser');
assert.equal(browser.isAndroidApp(), false);
await browser.initializeNativeApp({});
await browser.hideNativeSplash();

const listeners = new Map();
let exitCount = 0;
let splashCount = 0;
let backgroundCount = 0;
let foregroundCount = 0;
let consumeBack = true;
globalThis.window = {
  Capacitor: {
    getPlatform: () => 'android',
    Plugins: {
      App: {
        addListener(name, callback) {
          assert.ok(!listeners.has(name), `Duplicate listener: ${name}`);
          listeners.set(name, callback);
          return { remove: async () => listeners.delete(name) };
        },
        getState: async () => ({ isActive: false }),
        exitApp: async () => { exitCount += 1; },
      },
      SplashScreen: { hide: async () => { splashCount += 1; } },
    },
  },
};
const native = await import('../src/native-app.js?test=android');
const callbacks = {
  onBackground: () => { backgroundCount += 1; },
  onForeground: () => { foregroundCount += 1; },
  onBack: () => consumeBack,
};
await native.initializeNativeApp(callbacks);
await native.initializeNativeApp(callbacks);
assert.equal(listeners.size, 4);
assert.equal(backgroundCount, 1); // Уход в фон во время preload.
listeners.get('pause')();
listeners.get('resume')();
listeners.get('appStateChange')({ isActive: false });
listeners.get('appStateChange')({ isActive: true });
assert.equal(backgroundCount, 3);
assert.equal(foregroundCount, 2);
listeners.get('backButton')();
assert.equal(exitCount, 0);
consumeBack = false;
listeners.get('backButton')();
assert.equal(exitCount, 1);
await native.hideNativeSplash();
await native.hideNativeSplash();
assert.equal(splashCount, 1);
await native.disposeNativeApp();
assert.equal(listeners.size, 0);
console.log('[Android] Browser guard, lifecycle/Back, splash and listener cleanup validated (mock bridge).');
