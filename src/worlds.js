// Единая конфигурация игровых миров. Новые миры добавляются сюда без копирования сцены.
export const WORLD_STORAGE_KEY = 'fugu-merge-selected-world';
export const LEGACY_COLLECTION_KEY = 'fugu-merge-collection-levels';
export const LEGACY_BEST_SCORE_KEY = 'fugu-merge-best-score';

const makeCharacter = (data) => Object.freeze(data);

const FUGU_CHARACTERS = Object.freeze([
  makeCharacter({ level: 1, name: 'Пузырик', character: 'Добрый, наивный и любопытный.', description: 'Самый любопытный житель рифа. Верит, что каждый день приносит новое приключение.', radius: 25, color: 0xff5f9e, cssColor: '#ff5f9e', points: 10, textureKey: 'fugu-level-1', texturePath: './assets/fish/level1.png', bodyRatio: 0.71, originX: 0.532, originY: 0.488, progressScale: 0.98, animation: 'blink-level-1' }),
  makeCharacter({ level: 2, name: 'Лучик', character: 'Осторожный мечтатель.', description: 'Сначала внимательно посмотрит, а уже потом решится подплыть поближе.', radius: 33, color: 0xff9e3d, cssColor: '#ff9e3d', points: 25, textureKey: 'fugu-level-2', texturePath: './assets/fish/level2.png', bodyRatio: 0.72, originX: 0.518, originY: 0.489, progressScale: 1.02 }),
  makeCharacter({ level: 3, name: 'Хитрюша', character: 'Самоуверенный наблюдатель.', description: 'Всегда делает вид, что заранее знал, чем всё закончится.', radius: 42, color: 0xffd84a, cssColor: '#ffd84a', points: 50, textureKey: 'fugu-level-3', texturePath: './assets/fish/level3.png', bodyRatio: 0.68, originX: 0.522, originY: 0.488, progressScale: 0.93 }),
  makeCharacter({ level: 4, name: 'Спайк', character: 'Суровый, но заботливый защитник.', description: 'Если рядом опасность — первым встанет на защиту всей стаи.', radius: 53, color: 0x55cf86, cssColor: '#55cf86', points: 100, textureKey: 'fugu-level-4', texturePath: './assets/fish/level4.png', bodyRatio: 0.71, originX: 0.513, originY: 0.496, progressScale: 0.97 }),
  makeCharacter({ level: 5, name: 'Шалун', character: 'Весёлый проказник.', description: 'Никогда не упустит возможность поднять настроение соседям.', radius: 66, color: 0x48c5ed, cssColor: '#48c5ed', points: 200, textureKey: 'fugu-level-5', texturePath: './assets/fish/level5.png', bodyRatio: 0.70, originX: 0.513, originY: 0.479, progressScale: 1 }),
  makeCharacter({ level: 6, name: 'Удивляшка', character: 'Вечно чем-то поражён.', description: 'Каждый день для него — настоящее открытие.', radius: 81, color: 0x9a76ed, cssColor: '#9a76ed', points: 400, textureKey: 'fugu-level-6', texturePath: './assets/fish/level6.png', bodyRatio: 0.70, originX: 0.527, originY: 0.496, progressScale: 0.99 }),
  makeCharacter({ level: 7, name: 'Лео', character: 'Громкий весельчак и душа компании.', description: 'Если слышен весёлый смех — скорее всего, это Лео снова придумал что-то забавное.', radius: 98, color: 0xf04a3e, cssColor: '#f04a3e', points: 800, textureKey: 'fugu-level-7', texturePath: './assets/fish/level7.png', bodyRatio: 0.78, originX: 0.508, originY: 0.493, progressScale: 0.94 }),
  makeCharacter({ level: 8, name: 'Соня', character: 'Спокойный сонный философ.', description: 'Пока остальные суетятся, Соня спокойно досматривает очередной сон.', radius: 117, color: 0x263b62, cssColor: '#263b62', points: 1600, textureKey: 'fugu-level-8', texturePath: './assets/fish/level8.png', bodyRatio: 0.78, originX: 0.514, originY: 0.496, progressScale: 0.96 }),
  makeCharacter({ level: 9, name: 'Плакса', character: 'Очень чувствительный и добросердечный.', description: 'Самый чувствительный житель океана. Переживает по любому поводу, но никогда не теряет доброго сердца.', radius: 137, color: 0x72aee8, cssColor: '#72aee8', points: 3200, textureKey: 'fugu-level-9', texturePath: './assets/fish/level9.png', bodyRatio: 0.80, originX: 0.5, originY: 0.51, progressScale: 0.96 }),
]);

// Щупальца остаются вне круглого Matter-коллайдера благодаря originY и bodyRatio.
const JELLYFISH_CHARACTERS = Object.freeze([
  makeCharacter({ level: 1, name: 'Лучик', character: 'Лунная красавица.', description: 'Даже в самой тёмной воде умудряется найти что-нибудь прекрасное.', glowName: 'нежно-розовое', glowColor: '#FF73C8', glowColorNumber: 0xff73c8, radius: 25, color: 0xff73c8, cssColor: '#FF73C8', points: 10, textureKey: 'jellyfish-level-1', texturePath: './assets/jellyfish/level1.png', bodyRatio: 0.68, originX: 0.5, originY: 0.42, progressScale: 0.92 }),
  makeCharacter({ level: 2, name: 'Тучка', character: 'Тревожная, но преданная друзьям.', description: 'Немного тревожная и вечно о чём-то переживает. Лучше всего чувствует себя рядом с друзьями.', glowName: 'холодное голубое', glowColor: '#55BFFF', glowColorNumber: 0x55bfff, radius: 33, color: 0x55bfff, cssColor: '#55BFFF', points: 25, textureKey: 'jellyfish-level-2', texturePath: './assets/jellyfish/level2.png', bodyRatio: 0.68, originX: 0.5, originY: 0.42, progressScale: 0.92 }),
  makeCharacter({ level: 3, name: 'Искорка', character: 'Неутомимая исследовательница.', description: 'Любопытная до невозможности. Если где-то что-то блеснуло — она уже там.', glowName: 'янтарно-золотое', glowColor: '#FFB347', glowColorNumber: 0xffb347, radius: 42, color: 0xffb347, cssColor: '#FFB347', points: 50, textureKey: 'jellyfish-level-3', texturePath: './assets/jellyfish/level3.png', bodyRatio: 0.68, originX: 0.5, originY: 0.42, progressScale: 0.92 }),
  makeCharacter({ level: 4, name: 'Хихи', character: 'Смешливая душа компании.', description: 'Смеётся первой, иногда ещё до того, как поняла шутку.', glowName: 'сиренево-фиолетовое', glowColor: '#B56CFF', glowColorNumber: 0xb56cff, radius: 53, color: 0xb56cff, cssColor: '#B56CFF', points: 100, textureKey: 'jellyfish-level-4', texturePath: './assets/jellyfish/level4.png', bodyRatio: 0.68, originX: 0.5, originY: 0.42, progressScale: 0.92 }),
  makeCharacter({ level: 5, name: 'Мята', character: 'Спокойная и немного самоуверенная.', description: 'Спокойная, хитрая и немного самоуверенная. Кажется, она всегда знает чуть больше остальных.', glowName: 'мятно-бирюзовое', glowColor: '#45F0CE', glowColorNumber: 0x45f0ce, radius: 66, color: 0x45f0ce, cssColor: '#45F0CE', points: 200, textureKey: 'jellyfish-level-5', texturePath: './assets/jellyfish/level5.png', bodyRatio: 0.68, originX: 0.5, originY: 0.42, progressScale: 0.92 }),
  makeCharacter({ level: 6, name: 'Луна', character: 'Тихая мечтательница.', description: 'Мечтательница. Может долго смотреть в темноту и совершенно забыть, куда плыла.', glowName: 'жемчужно-белое', glowColor: '#EAF5FF', glowColorNumber: 0xeaf5ff, radius: 81, color: 0xeaf5ff, cssColor: '#EAF5FF', points: 400, textureKey: 'jellyfish-level-6', texturePath: './assets/jellyfish/level6.png', bodyRatio: 0.68, originX: 0.5, originY: 0.42, progressScale: 0.92 }),
  makeCharacter({ level: 7, name: 'Пламя', character: 'Смелая и вспыльчивая искательница приключений.', description: 'Вспыхивает от любой новой идеи и всегда первой бросается навстречу приключениям.', glowName: 'огненно-коралловое', glowColor: '#FF5A36', glowColorNumber: 0xff5a36, radius: 98, color: 0xff5a36, cssColor: '#FF5A36', points: 800, textureKey: 'jellyfish-level-7', texturePath: './assets/jellyfish/level7.png', bodyRatio: 0.68, originX: 0.5, originY: 0.42, progressScale: 0.92 }),
  makeCharacter({ level: 8, name: 'Аврора', character: 'Добрая собирательница подводных чудес.', description: 'Носит под куполом целое северное сияние и с радостью делится его красками со всеми вокруг.', glowName: 'полярно-бирюзовое', glowColor: '#55E8FF', glowColorNumber: 0x55e8ff, radius: 117, color: 0x55e8ff, cssColor: '#55E8FF', points: 1600, textureKey: 'jellyfish-level-8', texturePath: './assets/jellyfish/level8.png', bodyRatio: 0.68, originX: 0.5, originY: 0.42, progressScale: 0.92 }),
  makeCharacter({ level: 9, name: 'Ночка', character: 'Загадочная хранительница звёзд.', description: 'Говорит мало, зато знает, где прячутся самые красивые звёзды Лунной бухты.', glowName: 'звёздно-индиговое', glowColor: '#737CFF', glowColorNumber: 0x737cff, radius: 137, color: 0x737cff, cssColor: '#737CFF', points: 3200, textureKey: 'jellyfish-level-9', texturePath: './assets/jellyfish/level9.png', bodyRatio: 0.68, originX: 0.5, originY: 0.42, progressScale: 0.92 }),
]);

const background = (id, folder) => Object.freeze({
  seabedKey: `${id}-bottom-seabed`,
  seabedPath: `./assets/backgrounds/${folder}/bottom_seabed.png`,
  surfaceKey: `${id}-water-surface`,
  surfacePath: `./assets/backgrounds/${folder}/water_surface.png`,
});

const depthEvent = (id, folder, file) => Object.freeze({
  id,
  textureKey: `${folder}-${id}`,
  texturePath: `./assets/backgrounds/${folder}/${file}`,
});

export const WORLDS = Object.freeze({
  fugu: Object.freeze({
    id: 'fugu',
    name: 'Лагуна фугу',
    characterType: 'fugu',
    menuDescription: 'Тёплая лагуна с любопытными рыбками фугу.',
    previewCharacterLevel: 1,
    maxSupportedLevels: 9,
    characters: FUGU_CHARACTERS,
    backgrounds: background('fugu', 'fugu_back'),
    lockedTextureKey: 'character-locked',
    lockedTexturePath: './assets/locked/locked_fish.png',
    backgroundEvents: Object.freeze([
      depthEvent('shark', 'fugu_back', 'shark_shadow.png'),
      depthEvent('fish-school', 'fugu_back', 'fish_shadow.png'),
    ]),
    ambientSound: 'underwater_ambient',
    maxLevelMergeScore: 6400,
    themeClass: 'world-fugu',
    glow: null,
  }),
  jellyfish: Object.freeze({
    id: 'jellyfish',
    name: 'Лунная бухта',
    characterType: 'jellyfish',
    menuDescription: 'Ночная бездна с мягким биолюминесцентным сиянием.',
    previewCharacterLevel: 1,
    maxSupportedLevels: 9,
    characters: JELLYFISH_CHARACTERS,
    backgrounds: background('jellyfish', 'jellyfish_back'),
    lockedTextureKey: 'jellyfish-character-locked',
    lockedTexturePath: './assets/locked/locked_jellyfish.png',
    backgroundEvents: Object.freeze([]),
    ambientSound: 'underwater_ambient',
    maxLevelMergeScore: 6400,
    themeClass: 'world-jellyfish',
    glow: Object.freeze({
      sphereScale: 1.9,
      sphereAlpha: 0.78,
      mergeFlashDuration: 430,
      mergeFlashScale: 1.34,
      mergeParticleCount: 10,
    }),
  }),
});

export const DEFAULT_WORLD_ID = 'fugu';

export function readSelectedWorldId() {
  try {
    const saved = localStorage.getItem(WORLD_STORAGE_KEY);
    return saved && WORLDS[saved] ? saved : DEFAULT_WORLD_ID;
  } catch {
    return DEFAULT_WORLD_ID;
  }
}

export function saveSelectedWorldId(worldId) {
  if (!WORLDS[worldId]) return false;
  try {
    localStorage.setItem(WORLD_STORAGE_KEY, worldId);
  } catch {
    // Выбор действует до перезагрузки даже при запрещённом localStorage.
  }
  return true;
}

export function collectionStorageKey(worldId) {
  return `fugu-merge-collection-${worldId}`;
}

export function bestScoreStorageKey(worldId) {
  return `fugu-merge-best-score-${worldId}`;
}

export function highestLevelStorageKey(worldId) {
  return `fugu-merge-highest-level-${worldId}`;
}
