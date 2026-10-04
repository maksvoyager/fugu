import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Проверяем реальные методы сцены без Phaser и без изменения сохранений игрока.
const source = await readFile(new URL('../src/game.js', import.meta.url), 'utf8');
const showStart = source.indexOf('  async showFishUnlock(levelIndex) {');
const closeStart = source.indexOf('  closeFishUnlock(force = false) {', showStart);
const methodEnd = source.indexOf('  // ======================== Служебные QA-сценарии', closeStart);
assert.ok(showStart > 0 && closeStart > showStart && methodEnd > closeStart);
const methods = source.slice(showStart, methodEnd);
let completeDecode;
let warmup;
const makeFixture = () => {
  const frames = [];
  const timers = [];
  const classes = new Set();
  const ui = {
    fishUnlockModal: { hidden: true, dataset: {}, classList: {
      add: (name) => classes.add(name), remove: (name) => classes.delete(name),
    } },
    fishUnlockImage: { decode: () => new Promise((resolve) => { completeDecode = resolve; }) },
    fishUnlockName: {}, fishUnlockDescription: {},
  };
  const window = {
    clearTimeout() {},
    setTimeout(callback, delay) { timers.push({ callback, delay }); return timers.length; },
    requestAnimationFrame(callback) { frames.push(callback); },
  };
  const factory = new Function('ui', 'window', 'FRUITS', 'FISH_DATA', 'ATLAS_CONFIG',
    'prepareUnlockImage', 'characterName', 'characterDescription', 'performance',
    `return { ${methods.replace('  closeFishUnlock', '  ,closeFishUnlock')} };`);
  const characters = [{}, { texturePath: './assets/test.png', name: 'Test', description: 'Description' }];
  const scene = factory(ui, window, characters, characters,
    { unlockDismissDelay: 1500, unlockAutoCloseDelay: 3000 },
    () => new Promise((resolve) => { warmup = resolve; }),
    (data) => data.name, (data) => data.description, { now: () => 100 });
  Object.assign(scene, { unlockRevealRevision: 0, world: { lockedTexturePath: './assets/locked.png' },
    configureAtlasImage(image, path) { image.src = path; } });
  return { scene, ui, frames, timers };
};
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
const fixture = makeFixture();
const pending = fixture.scene.showFishUnlock(1);
assert.equal(fixture.ui.fishUnlockModal.hidden, true);
warmup(); await flush();
assert.equal(fixture.ui.fishUnlockName.textContent, 'Test');
assert.equal(fixture.ui.fishUnlockModal.hidden, true);
completeDecode(); await flush();
assert.equal(fixture.frames.length, 1);
fixture.frames.shift()();
assert.equal(fixture.ui.fishUnlockModal.hidden, true);
fixture.frames.shift()(); await pending;
assert.equal(fixture.ui.fishUnlockModal.hidden, false);
assert.deepEqual(fixture.timers.map(({ delay }) => delay), [1500, 3000]);
fixture.scene.closeFishUnlock(true);
assert.equal(fixture.ui.fishUnlockModal.hidden, true);

const cancelled = makeFixture();
const cancelledReveal = cancelled.scene.showFishUnlock(1);
cancelled.scene.closeFishUnlock(true); warmup(); await cancelledReveal;
assert.equal(cancelled.ui.fishUnlockModal.hidden, true);
assert.equal(cancelled.timers.length, 0);
console.log('[Unlock] Decode before reveal, two-frame separation, unchanged timers and pending reveal cancellation validated.');
