# BLOOP: одна кодовая база для web и Android

## Архитектура

Исходники игры находятся только в корневых `src/`, `assets/`, `index.html`.
`scripts/build-web.mjs` собирает их в `www/` без Vite/Webpack.
Capacitor копирует результат в `android/app/src/main/assets/public/`: это
генерируемые ресурсы APK, не отдельная игра. Не редактируйте эти копии вручную.
`www/`, скопированные web assets, node_modules и результаты Gradle исключены из Git.

GitHub Pages продолжает использовать корневые файлы и относительные пути.
В репозитории нет отдельного deployment action; настройки публикации в GitHub
не менялись. Не публикуйте содержимое node_modules/android/www как web-исходники.

## Версии и настройки

- Capacitor core/cli/android: **8.5.2**, стабильная ветка 8.
- Официальные App: **8.1.1**, SplashScreen: **8.0.2**.
- Node **22+**; здесь проверен **24.19.0**.
- Android Gradle Plugin **8.13.0**, Gradle **8.14.3**, Java **21**.
- minSdk **24**, compileSdk и targetSdk **36**.
- App ID / namespace / Java package: **com.voyager.bloop**.
- App name: **BLOOP**, webDir: **www**.
- Конфигурация: `capacitor.config.json`, SDK: `android/variables.gradle`.

Версии основных Capacitor-пакетов согласованы. `pnpm-lock.yaml` фиксирует зависимости:
воспроизводимая установка — `pnpm install --frozen-lockfile`. `npm install` тоже
поддерживается, но npm не читает pnpm lockfile.

## Установка окружения

Установите Android Studio **2025.2.1 или новее**. Через SDK Manager установите:
Android SDK Platform **36**, Build-Tools **36.0.0**, Platform-Tools,
SDK Command-line Tools и образ Android 16 / API 36 для эмулятора, если он нужен.

В Gradle JDK выберите **JDK 21**. Если встроенный `jbr` новой Studio другой версии,
выберите отдельный JDK 21. Для командной сборки задайте `JAVA_HOME` на каталог этого
JDK и добавьте `bin` в PATH. Studio обычно сама создаёт `android/local.properties`
с SDK path. Это машинный файл, не добавляйте его в Git.
Для телефона включите USB debugging; альтернативно запустите эмулятор API 36.

```powershell
npm install
npm run check
npm run android:sync
npm run android:open
# После настройки SDK и подключения устройства:
npm run android:run
npm run android:debug
npm run android:bundle
```

Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
Unsigned release AAB: `android/app/build/outputs/bundle/release/app-release.aab`.
`android:debug` вызывает assembleDebug, `android:bundle` — bundleRelease.
Production keystore не создавался, пароли не сохранялись. Для публикации потребуется
upload key и подписание AAB через Android Studio Generate Signed Bundle / APK,
затем Play App Signing. Ключи храните вне репозитория; debug key не годится для Play.
Также потребуются карточка приложения, Data Safety/privacy, возрастной рейтинг
и проверка актуальных требований Google Play на дату выпуска. Автопубликации нет.

## WebView и safe areas

Activity зафиксирована в portrait; browser orientation не менялась.
На больших экранах Android 16 система может игнорировать ограничение ориентации:
планшеты требуется проверить отдельно.
MainActivity использует WindowInsetsControllerCompat: edge-to-edge, скрытые system bars
и SHOW_TRANSIENT_BARS_BY_SWIPE. Режим восстанавливается при onResume/возврате фокуса.
`SystemBars.insetsHandling: disable` отключает padding всего decorView в старых WebView.
Один native WindowInsets listener передаёт вырез/видимые панели в CSS variables только
для HUD/модальных окон; размер фонового canvas не уменьшается.
Заставка и WebView используют существующий BLOOP cyan **#087ec4**.

В копии CSS сборщик заменяет `env(safe-area-inset-*)` на
`var(--safe-area-inset-*, env(safe-area-inset-*))`. Исходный CSS не меняется.
Native safe areas публикуются при изменении insets и после загрузки страницы,
без polling/покадровых bridge-вызовов. Safari продолжает использовать env().
Zoom, overscroll и long-press context menu отключены только у native WebView.
Phaser touch/pointer и scrolling Atlas остаются общими.

server.url отсутствует. Cleartext/mixed content не включены, WebView debugging
выключен, allowNavigation не расширялся. Игра не загружается с GitHub Pages.

## Lifecycle и Android Back

`src/native-app.js` использует официальные App/SplashScreen proxy, внедрённые
Capacitor в Android. В браузере модуль безопасно пропускает native-вызовы.
Listener устанавливаются один раз на приложение; restart сцены не дублирует их,
при destroy игры они удаляются. Bridge не вызывается из update().

При pause/background отменяется drag и открывается существующая игровая пауза.
Matter, clock, TweenManager и Phaser loop останавливаются. Эффекты звука
останавливаются, ambient ставится на паузу. При foreground loop просыпается с
обновлённым временем; партия ожидает Continue. Настройки Sound/Ambient сохраняются,
разблокировка аудио выполняется после следующего действия игрока.

Back закрывает language/settings/worlds/detail/atlas/unlock. В gameplay открывает
Pause; из Pause/Game Over возвращает Main Menu; из Main Menu завершает Activity
через App.exitApp(). Закрытие использует существующие функции экранов.
Флаг nativeInBackground также блокирует поздний запуск звука после незавершённого
AudioContext unlock; этот флаг применяется исключительно в Android lifecycle.

## i18n и сохранения

Переводы общие: en, ru, es, pt-BR, de. Язык WebView определяется через
navigator.languages/navigator.language; сохранённый ручной выбор имеет приоритет.
LocalStorage keys не менялись: fugu-merge-language, fugu-merge-selected-world,
fugu-merge-sound-enabled, fugu-merge-ambient-enabled,
fugu-merge-collection-{world}, fugu-merge-best-score-{world},
fugu-merge-highest-level-{world} и прежние migration keys.
Android и браузер имеют разные локальные хранилища; синхронизации прогресса нет.

## Сеть и разрешения

JS/CSS, Phaser, персонажи, фоны, audio, glow SVG, переводы и branding встроены в APK.
Единственная внешняя web-зависимость — Nunito из Google Fonts (fonts.googleapis.com,
fonts.gstatic.com), подключённый в HTML и CSS @import. Без сети применяется
существующий system-ui fallback; игра не требует загрузки шрифта для запуска.
Эти подключения не заменялись.

Единственное объявленное permission — **INTERNET**, из шаблона Capacitor.
App/SplashScreen/core не заявляют дополнительных permission в своих manifests.
ACCESS_NETWORK_STATE, POST_NOTIFICATIONS, AD_ID, location, camera, microphone,
storage/media не добавлены. FileProvider из template не экспортирован и не
является permission. Analytics, Firebase, реклама, billing, tracking отсутствуют.
Необязательная Google Services Gradle-интеграция из template удалена.
Merged manifest следует дополнительно проверить после успешной Android-сборки.

## Иконка и заставка

Launcher icons пяти density созданы из assets/branding/bloop-icon.png.
Adaptive foreground 108dp содержит весь исходник в центральном квадрате 46dp:
его диагональ меньше безопасного круга 66dp. Рыба/пузыри сохраняются при масках
Android, ценой небольшого размера рисунка. Background — цвет BLOOP cyan.
Оригинал не изменён, новый рисунок не создавался.
Логотип скопирован без изменения в drawable-nodpi.

Заставка использует Android SplashScreen API / AndroidX compatibility,
native app icon и оригинальный логотип (branding на API 31+).
hideNativeSplash() вызывается после первого POST_RENDER готовой FruitScene;
искусственной задержки нет. Цвет post-splash theme/WebView совпадает с заставкой.

## Проверки

Пройдены build, Capacitor add/sync/doctor, npm run check, 133 ключа пяти локалей,
проверки ID/API/ресурсов/permissions и mock bridge browser guard/lifecycle/Back/
splash/cleanup. Mock bridge не заменяет проверку Android runtime.
Обновление 2026-10-04: с установленными JDK 21 и SDK debug assembleDebug проходит;
APK установлен через install -r на Redmi Note 8T/API 30 без очистки данных.
При BLOOP в фокусе диагностика подтверждает surface 1080×2340, обе system bars
visible=false, cutout=always и transient bars by swipe. Release AAB в этом обновлении не собирался.
В браузере проверены меню, Play/Pause, настройки Sound/Ambient, смена языка,
выбор миров и Atlas; QA merge обоих миров даёт 25 очков, QA Game Over открывает
существующий экран. Собранная копия www тоже запускается; проверенные ресурсы
отвечают HTTP 200. Ошибок console нет. QA merge без первого пользовательского
жеста выдаёт прежнее ожидаемое предупреждение AudioContext suspended.
59 bundled ресурсов (кроме преобразованного CSS safe areas) совпадают с исходниками.
Safari/iPhone не проверялись. Полный ручной Android regression checklist ниже остаётся актуальным.

Settings использует общий `.settings-options` и `--settings-row-gap: 12px`.
RU/EN/DE/ES/PT-BR проверены на мобильном layout, немецкий дополнительно на
390×844, 393×851, 412×915 и 430×932: переполнения строк/горизонтального scroll нет.
Unlock заранее декодирует ближайший PNG (ограниченный cache из двух изображений),
ждёт decode самой DOM-картинки и отделяет reveal двумя requestAnimationFrame от merge.
Модалка, blur/тени, VFX и таймеры 1500/3000 мс сохранены. Pending reveal защищён
revision от устаревших callback после close/restart. `node scripts/check-unlock-flow.mjs`
проверяет последовательность и отмену; GPU-фриз Redmi требует проверки первого открытия
на устройстве, точная длительность/первопричина профилем пока не измерена.

На реальном Android проверить cold start без белой вспышки, cutout/gesture safe areas,
portrait, touch/drag/release/multi-touch, оба мира/merge, Atlas scroll, settings/языки,
mute/ambient, background/foreground и lock/unlock, Back каждого modal, Restart,
Game Over и сохранения после перезапуска приложения. Проверить длинную сессию,
glow/idle/частые merge и рост памяти. Графика не упрощалась; в native интеграции
нет per-frame allocations/bridge calls, только постоянные lifecycle listener.

## Мой обычный workflow

Редактируйте игру один раз в корневом web source.

Browser / GitHub Pages:

```powershell
npm run check
npm run dev
# После проверки — обычный commit/push исходников в GitHub Pages репозиторий.
```

Android:

```powershell
npm run android:sync
npm run android:open
# Запуск или получение сборок:
npm run android:run
npm run android:debug
npm run android:bundle
```

Не копируйте вручную изменённые game.js/assets в Android.
