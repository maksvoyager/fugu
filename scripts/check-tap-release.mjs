import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Реальные методы управления: тап, drag, двойной pointerup и запреты UI.
const source = await readFile(new URL('../src/game.js', import.meta.url), 'utf8');
const start = source.indexOf('  isSafeGameplayPointer(pointer) {');
const end = source.indexOf('  // ======================== Столкновения', start);
assert.ok(start > 0 && end > start);
let modalOpen = false;
const ui = { gameWrap: { querySelector: () => modalOpen ? {} : null } };
const controls = { WAITING: 'waiting', DRAGGING: 'dragging', RELEASED: 'released' };
const methods = new Function('ui', 'CONTROL_STATES', `
  const GAME_WIDTH = 400, SURFACE_Y = 104, gameHeight = 800;
  const PHYSICS_CONFIG = { releaseVelocityY: -1 };
  const GAMEPLAY = { riseSpeedMultiplier: 3, spawnDelay: 450 };
  let hasCompletedFirstDrop = true;
  const Controls = class { ${source.slice(start, end)} };
  return Object.fromEntries(Object.getOwnPropertyNames(Controls.prototype)
    .filter(name => name !== 'constructor').map(name => [name, Controls.prototype[name]]));
`)(ui, controls);
function scene() {
  let activations = 0, spawnTimers = 0;
  const held = { visual: { x: 200 }, physics: { setVelocity() {} } };
  return {
    ...methods, currentFruit: held, canDrop: true, controlState: controls.WAITING,
    guide: { setVisible() {} }, time: { delayedCall() { spawnTimers++; } },
    positionCurrentFruit(x) { this.lastDragX = x; },
    dragCurrentFruit(pointer) {
      if (pointer.id === this.activePointerId) this.lastDragX = pointer.worldX + this.dragOffsetX;
    },
    activateFruitPhysics() { activations++; }, playSound() {},
    counts: () => ({ activations, spawnTimers }),
  };
}
const pointer = (x = 80, y = 300, id = 1) => ({
  id, worldX: x, worldY: y, event: { button: 0, target: { closest: () => null } },
});
const tap = scene();
tap.beginCurrentFruitDrag(pointer());
tap.releaseCurrentFruit(pointer());
assert.equal(tap.lastDragX, 200); // Тап не перемещает прицел к пальцу.
tap.releaseCurrentFruit(pointer());
assert.deepEqual(tap.counts(), { activations: 1, spawnTimers: 1 });
const drag = scene();
drag.beginCurrentFruitDrag(pointer());
drag.releaseCurrentFruit(pointer(110));
assert.equal(drag.lastDragX, 230);
const multi = scene();
multi.beginCurrentFruitDrag(pointer());
multi.releaseCurrentFruit(pointer(80, 300, 2));
assert.equal(multi.currentFruit !== null, true);
multi.cancelCurrentFruitDrag(pointer());
assert.equal(multi.controlState, controls.WAITING);
assert.deepEqual(multi.counts(), { activations: 0, spawnTimers: 0 });
for (const state of ['isPaused', 'gameEnded', 'isMainMenuOpen']) {
  const blocked = scene(); blocked[state] = true;
  blocked.beginCurrentFruitDrag(pointer());
  assert.equal(blocked.controlState, controls.WAITING);
}
modalOpen = true;
assert.equal(scene().isSafeGameplayPointer(pointer()), false);
modalOpen = false;
const uiTap = pointer(); uiTap.event.target.closest = () => ({});
assert.equal(scene().isSafeGameplayPointer(uiTap), false);
for (const outside of [pointer(-1), pointer(401), pointer(80, 20), pointer(80, 801)]) {
  assert.equal(scene().isSafeGameplayPointer(outside), false);
}
console.log('[Controls] Tap preserves X; drag, cancel, multi-touch, UI guards and single release verified.');
