import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Тестируем реальный renderAtlas без Phaser/браузера и без записей в localStorage.
const source = await readFile(new URL('../src/game.js', import.meta.url), 'utf8');
const start = source.indexOf('  renderAtlas() {');
const end = source.indexOf('  openAtlas() {', start);
assert.ok(start > 0 && end > start);
let created = 0;
let listeners = 0;
let locale = 'ru';
class Node {
  constructor(tag = 'div') {
    this.tag = tag; this.children = []; this.dataset = {}; this.attributes = {};
    this.writes = 0; this.replacements = 0;
    const classes = new Set();
    this.classList = { toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); }, add(name) { classes.add(name); } };
    this.style = { setProperty() {} };
  }
  append(...nodes) { this.children.push(...nodes); }
  appendChild(node) { this.append(node); }
  replaceChildren(...nodes) { this.replacements++; this.children = nodes; }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener() { listeners++; }
  set src(value) { this.imagePath = value; this.writes++; }
}
const document = { createElement(tag) { created++; return new Node(tag); } };
const character = (level) => ({ level, texturePath: `./assets/level${level}.png`, name: `name${level}`, description: 'description' });
const worlds = Object.fromEntries(['fugu', 'jellyfish'].map((id) => [id,
  { id, characters: Array.from({ length: 9 }, (_, index) => character(index + 1)), lockedTexturePath: './assets/locked.png' }]));
const collection = { fugu: new Set([0]), jellyfish: new Set([0]) };
const ui = { atlasGrid: new Node(), atlasWorldTabs: new Node() };
const cache = new Map();
const factory = new Function('ui', 'document', 'WORLDS', 'readCollectionLevels', 'worldName',
  'characterName', 'characterDescription', 't', 'ATLAS_CONFIG', 'getLocale', 'atlasViewCache', 'atlasTabCache',
  `return { ${source.slice(start, end)} };`);
const scene = factory(ui, document, worlds, (world) => collection[world.id], (world) => world.id,
  (data) => data.name, (data) => data.description, (key) => `${locale}:${key}`, { lockedDescription: '' },
  () => locale, cache, new Map());
scene.world = worlds.fugu;
scene.atlasWorldId = 'fugu';
scene.configureAtlasImage = (image, path, fallback, alt) => { image.src = path; image.alt = alt; };
scene.renderAtlas();
const firstCards = [...ui.atlasGrid.children];
const initialCreated = created;
for (let count = 0; count < 20; count++) scene.renderAtlas();
assert.equal(created, initialCreated);
assert.equal(ui.atlasGrid.replacements, 1);
assert.deepEqual(ui.atlasGrid.children, firstCards);
assert.equal(listeners, 0, 'No listeners may be added by repeated renderAtlas calls.');
collection.fugu.add(1);
scene.renderAtlas();
assert.deepEqual(cache.get('fugu').rows.map((row) => row.image.writes), [1, 2, 1, 1, 1, 1, 1, 1, 1]);
locale = 'de'; scene.renderAtlas();
assert.equal(created, initialCreated);
assert.deepEqual(cache.get('fugu').rows.map((row) => row.image.writes), [1, 2, 1, 1, 1, 1, 1, 1, 1]);
for (let count = 0; count < 20; count++) {
  scene.atlasWorldId = 'jellyfish'; scene.renderAtlas();
  scene.atlasWorldId = 'fugu'; scene.renderAtlas();
}
assert.equal(cache.size, 2);
assert.equal(cache.get('jellyfish').rows.length, 9);
assert.deepEqual(ui.atlasGrid.children, firstCards);
assert.equal(listeners, 0);
console.log('[Atlas] 20 repeat renders/world switches: stable DOM, no listener creation, only changed unlock image, no src reset on locale change.');
