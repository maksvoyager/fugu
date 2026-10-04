# Фугу: вверх! — браузерный прототип

Спокойная мобильная merge-игра на HTML, CSS, JavaScript, Phaser 3 и Matter.js.
Рыбки всплывают снизу, сталкиваются и объединяются в следующий уровень.

## Как запустить

1. Установите [Node.js](https://nodejs.org/) версии 22 или новее.
2. Откройте терминал в папке проекта.
3. Выполните `npm run dev`.
4. Откройте `http://127.0.0.1:5173`.

Остановить сервер можно сочетанием `Ctrl + C`.

## Где находятся настройки

Файл `src/fruits.js` содержит:

- `FRUITS` — номера, цвета, радиусы и очки шести уровней;
- `texturePath` — путь к PNG соответствующего уровня;
- `bodyRatio` — доля ширины PNG, которую занимает круглое тело рыбы;
- `originX` и `originY` — точка центра тела внутри изображения;
- `maxLevel` — максимальный уровень (сейчас 6);
- `maxLevelMergeScore` — бонус за исчезновение пары максимального уровня;
- `buoyancyForce` — основная подъёмная сила;
- `surfaceFadeDistance` — расстояние, на котором сила плавно затухает у поверхности;
- `upwardGravity` — сила всплытия (более отрицательное число = быстрее);
- `waterDrag` — сопротивление воды (большее число = плавнее и медленнее);
- `maxRiseSpeed` — максимальная скорость вверх;
- `dangerDelay` — задержка Game Over в миллисекундах;
- `dangerZoneTop` и `dangerZoneBottom` — границы опасной зоны.

## Структура проекта

- `index.html` — пузырьковый интерфейс, модальные окна и панели.
- `src/style.css` — подводный фон, glassmorphism и адаптивность.
- `src/fruits.js` — игровые параметры шести уровней.
- `src/game.js` — Phaser-сцена, Matter-физика, merge, пауза и рекорд.
- `vendor/phaser.min.js` — локальная копия Phaser 3 с Matter.js.
- `server.mjs` — простой локальный сервер.

## Android development

Web и Android используют одни `src/`, `assets/`, переводы и `index.html`.
Конфигурация: `capacitor.config.json`; native project: `android/`;
Application ID: **com.voyager.bloop**. `www/` — генерируемая сборка, не исходники.
GitHub Pages продолжает использовать файлы из корня проекта.

Нужны Node 22+, Android Studio 2025.2.1 или новее, JDK 21, Android SDK Platform 36,
Build-Tools 36.0.0, Platform-Tools и SDK Command-line Tools.
В Studio выберите Gradle JDK 21; для терминала настройте `JAVA_HOME` на этот JDK.
Studio создаст локальный `android/local.properties` с путём SDK. Не добавляйте его в Git.

```powershell
npm install
npm run check
npm run android:sync   # собрать www и выполнить Capacitor sync
npm run android:open   # открыть созданный Android-проект
npm run android:run    # sync и запуск на телефоне/эмуляторе
```

После каждого изменения web-кода выполняйте `npm run android:sync`.
Для сборки и диагностики:

```powershell
npm run android:check
npm run android:debug
npm run android:bundle
```

Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
Unsigned release AAB: `android/app/build/outputs/bundle/release/app-release.aab`.
Production signing ещё не настроен. Для Google Play потребуется upload key и
Play App Signing; ключи и пароли храните вне репозитория.

Browser: `npm run dev`, затем обычная публикация исходников в GitHub Pages.
Подробная настройка и проверка устройства: [ANDROID.md](./ANDROID.md).
