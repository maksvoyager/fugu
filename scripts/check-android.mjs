import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORLDS } from '../src/worlds.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFile(resolve(root, path), 'utf8');
const config = JSON.parse(await read('capacitor.config.json'));
const manifest = await read('android/app/src/main/AndroidManifest.xml');
const gradle = await read('android/app/build.gradle');
const variables = await read('android/variables.gradle');

assert.equal(config.appId, 'com.voyager.bloop');
assert.equal(config.webDir, 'www');
assert.ok(!config.server?.url, 'Production must use local bundled web assets.');
assert.equal(config.android.allowMixedContent, false);
assert.equal(config.android.webContentsDebuggingEnabled, false);
assert.equal(config.plugins.SystemBars.insetsHandling, 'disable');
const activity = await read('android/app/src/main/java/com/voyager/bloop/MainActivity.java');
assert.match(activity, /BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE/);
assert.match(activity, /setDecorFitsSystemWindows\(getWindow\(\), false\)/);
assert.match(activity, /Type\.displayCutout\(\)/);
assert.match(activity, /onWindowFocusChanged/);
assert.match(gradle, /namespace\s*=\s*"com\.voyager\.bloop"/);
assert.match(gradle, /applicationId\s+"com\.voyager\.bloop"/);
assert.match(manifest, /android:screenOrientation="portrait"/);
assert.ok(!manifest.includes('usesCleartextTraffic="true"'));
for (const name of ['targetSdkVersion', 'compileSdkVersion']) {
  const value = Number(variables.match(new RegExp(`${name}\\s*=\\s*(\\d+)`))?.[1]);
  assert.ok(value >= 36, `${name} must be at least 36.`);
}
const permissions = [...manifest.matchAll(/<uses-permission\s+android:name="([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(permissions, ['android.permission.INTERNET']);

// Проверка всех текущих персонажей и фонов: Android использует те же относительные пути.
for (const world of Object.values(WORLDS)) {
  const paths = [
    world.lockedTexturePath, world.backgrounds.seabedPath, world.backgrounds.surfacePath,
    ...world.characters.map((character) => character.texturePath),
    ...world.backgroundEvents.map((event) => event.texturePath),
  ];
  for (const path of paths) {
    assert.ok(path.startsWith('./assets/'), `Non-relative resource: ${path}`);
    await access(resolve(root, path));
  }
}
console.log('[Android] ID, bundled assets, API 36, portrait and permissions validated.');
