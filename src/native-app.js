// ---------- Минимальный мост Android → существующая web-игра ----------
// Capacitor сам внедряет эти официальные proxy в native WebView.
// Браузер не импортирует node_modules и не вызывает native API.
export const isAndroidApp = () => window.Capacitor?.getPlatform?.() === 'android';

let initialized = false;
let splashHidden = false;
let listenerHandles = [];

export async function initializeNativeApp({ onBackground, onForeground, onBack }) {
  if (!isAndroidApp() || initialized) return;
  initialized = true;
  const app = window.Capacitor.Plugins?.App;
  if (!app) {
    console.error('[Android] Official App plugin is unavailable. Run android:sync.');
    return;
  }

  // Эти listener живут один раз на приложение, а не создаются после каждого restart сцены.
  try {
    // pause срабатывает уже при onPause Activity, раньше полного onStop/appStateChange.
    listenerHandles.push(await app.addListener('pause', onBackground));
    listenerHandles.push(await app.addListener('resume', onForeground));
    listenerHandles.push(await app.addListener('appStateChange', ({ isActive }) => {
      if (isActive) onForeground();
      else onBackground();
    }));
    listenerHandles.push(await app.addListener('backButton', () => {
      if (!onBack()) void app.exitApp();
    }));
    // Защита от ухода в фон ещё во время preload.
    const { isActive } = await app.getState();
    if (!isActive) onBackground();
  } catch (error) {
    console.error('[Android] Lifecycle initialization failed:', error);
  }
}

export async function hideNativeSplash() {
  if (!isAndroidApp() || splashHidden) return;
  const splash = window.Capacitor.Plugins?.SplashScreen;
  if (!splash) return;
  try {
    await splash.hide();
    splashHidden = true;
  } catch (error) {
    console.warn('[Android] Splash could not be hidden:', error);
  }
}

export async function disposeNativeApp() {
  const handles = listenerHandles;
  listenerHandles = [];
  await Promise.all(handles.map((handle) => handle.remove()));
  initialized = false;
}
