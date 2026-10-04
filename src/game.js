import { STARTING_LEVELS, GAMEPLAY, PROGRESS_UI } from './fruits.js';
import { initializeNativeApp, hideNativeSplash, disposeNativeApp } from './native-app.js';
import {
  WORLDS,
  LEGACY_COLLECTION_KEY,
  LEGACY_BEST_SCORE_KEY,
  readSelectedWorldId,
  saveSelectedWorldId,
  collectionStorageKey,
  bestScoreStorageKey,
  highestLevelStorageKey,
} from './worlds.js';
import {
  LANGUAGE_OPTIONS,
  applyTranslations,
  formatNumber,
  getLanguageLabel,
  getLocale,
  onLanguageChanged,
  setLocale,
  t,
} from './i18n/index.js';

const Phaser = window.Phaser;

// ---------- Составная рыба первого уровня и анимация глаз ----------
const FISH_ANIMATION = Object.freeze({
  levelIndex: 0,
  bodyTextureKey: 'fish-level-1-body',
  bodyTexturePath: './assets/fish/animated/level1/body.png',
  eyesClosedTextureKey: 'fish-level-1-eyes-closed',
  eyesClosedTexturePath: './assets/fish/animated/level1/eyes_closed.png',

  // Случайное моргание глаз
  blinkMinDelay: 2500,
  blinkMaxDelay: 6000,
  blinkDuration: 120,
  doubleBlinkChance: 0.12,
  doubleBlinkOpenMinDelay: 80,
  doubleBlinkOpenMaxDelay: 120,
  doubleBlinkDuration: 100,
});

// ---------- Спокойные idle-анимации персонажей ----------
// Циклы меняют только внутренний visual-контейнер и не затрагивают Matter body.
const CHARACTER_IDLE_CONFIG = Object.freeze({
  fugu: Object.freeze({
    breathScaleXMin: 1.023,
    breathScaleXMax: 1.027,
    breathScaleYMin: 1.016,
    breathScaleYMax: 1.020,
    breathDurationMin: 1200,
    breathDurationMax: 1600,
    breathRestMin: 300,
    breathRestMax: 700,
    floatUpOffset: -2,
    floatDownOffset: 1,
    floatRotationMin: 0.5,
    floatRotationMax: 0.7,
    floatCycleDurationMin: 3600,
    floatCycleDurationMax: 5200,
    maxInitialDelay: 1200,
  }),
  jellyfish: Object.freeze({
    pulseScaleXMin: 1.032,
    pulseScaleXMax: 1.038,
    pulseScaleYMin: 0.950,
    pulseScaleYMax: 0.960,
    pulseDurationMin: 900,
    pulseDurationMax: 1300,
    pulseRestMin: 300,
    pulseRestMax: 600,
    floatUpOffset: -3,
    floatDownOffset: 2,
    floatCycleDurationMin: 2600,
    floatCycleDurationMax: 3800,
    glowScaleMin: 1.07,
    glowScaleMax: 1.09,
    glowAlphaMultiplierMin: 1.27,
    glowAlphaMultiplierMax: 1.33,
    maxInitialDelay: 1400,
  }),
});

// ---------- Данные подводного атласа ----------
let activeWorldId = readSelectedWorldId();
let activeWorld = WORLDS[activeWorldId];
let FRUITS = activeWorld.characters;
let FISH_DATA = FRUITS;
let startSceneWithoutMainMenu = false;
let forceMainMenuAfterRestart = false;

const GLOW_SPHERE_TEXTURE_KEY = 'jellyfish-glow-sphere';
const GLOW_SPHERE_TEXTURE_PATH = './assets/effects/glow_sphere.svg';

// ---------- Редкие силуэты в глубине ----------
const SHARK_CONFIG = Object.freeze({
  enabled: true,
  depth: 0.75,
  baseWidthRatio: 0.72,
  checkInterval: 20000,
  spawnChance: 0.2,
  // Не позволяет случайности скрывать акулу бесконечно долго.
  maxFailedChecks: 4,
  firstAppearanceDelay: 25000,
  postPassMinInterval: 16000,
  postPassMaxInterval: 24000,
  minTravelTime: 9000,
  maxTravelTime: 14000,
  minScale: 0.85,
  maxScale: 1.15,
  minAlpha: 0.06,
  maxAlpha: 0.12,
  fadeDuration: 1200,
  minYPercent: 0.15,
  maxYPercent: 0.35,
  edgeRevealRatio: 0.08,
});

const ATLAS_CONFIG = Object.freeze({
  lockedDescription: '',
  unlockDismissDelay: 1500,
  unlockAutoCloseDelay: 3000,
});

// ---------- Звуки ----------
const AUDIO = Object.freeze({
  enabled: true,
  masterVolume: 0.75,
  buttonVolume: 0.35,
  releaseVolume: 0.40,
  mergeVolume: 0.55,
  unlockVolume: 0.65,
  recordVolume: 0.70,
  maxMergeVolume: 0.75,
  gameOverVolume: 0.55,
  ambientEnabled: true,
  ambientVolume: 0.12,
  ambientFadeInMs: 1800,
  ambientFadeOutMs: 500,
  ambientPauseVolumeRatio: 0.35,
  ambientGameOverVolumeRatio: 0.5,
  ambientKey: 'underwater_ambient',
  ambientPath: './assets/audio/underwater_ambient.mp3',
  files: Object.freeze({
    button: Object.freeze({ key: 'sound-button', path: './assets/audio/button.mp3', volume: 'buttonVolume' }),
    release: Object.freeze({ key: 'sound-release', path: './assets/audio/release.mp3', volume: 'releaseVolume' }),
    merge: Object.freeze({ key: 'sound-merge', path: './assets/audio/merge.mp3', volume: 'mergeVolume' }),
    unlock: Object.freeze({ key: 'sound-unlock', path: './assets/audio/unlock.mp3', volume: 'unlockVolume' }),
    record: Object.freeze({ key: 'sound-record', path: './assets/audio/record.mp3', volume: 'recordVolume' }),
    maxMerge: Object.freeze({ key: 'sound-max-merge', path: './assets/audio/max_merge.mp3', volume: 'maxMergeVolume' }),
    gameOver: Object.freeze({ key: 'sound-game-over', path: './assets/audio/game_over.mp3', volume: 'gameOverVolume' }),
  }),
});

// ---------- Основная геометрия сцены ----------
const SCENE_CONFIG = Object.freeze({
  width: 540,
  desktopHeight: 960,
  mobileBreakpoint: 600,
  minimumMobileHeight: 760,
  spawnBottomOffset: 160,
  gameOverOffsetAboveSpawn: 24,
  wallSize: 28,
  surfaceY: 104,
  maximumStartingLevelCount: 3,
  maximumRenderResolution: 2,
});

// ---------- Физика Matter.js ----------
const PHYSICS_CONFIG = Object.freeze({
  positionIterations: 8,
  velocityIterations: 6,
  wallFriction: 0.08,
  wallStaticFriction: 0.05,
  surfaceStaticFriction: 0.04,
  restitution: 0.02,
  fishDensity: 0.0018,
  releaseVelocityY: -0.35,
  maximumHorizontalSpeed: 3.2,
  stablePileDistance: 260,
  stablePileSpeed: 0.16,
  minimumBuoyancyFactor: 0.01,
  minimumAngularVelocity: 0.0005,
  trailMinimumRiseSpeed: -0.45,
});

// ---------- Вертикальная линия наведения ----------
const GUIDE_CONFIG = Object.freeze({
  width: 2,
  color: 0xffffff,
  alpha: 0.22,
  surfaceOffset: 26,
  depth: 1,
});

// ---------- Видимая граница зоны проигрыша ----------
const GAME_OVER_LIMIT_CONFIG = Object.freeze({
  depth: 3,
  width: 2,
  color: 0xffffff,
  alpha: 0.34,
  sideInset: 0,
  dashLength: 12,
  gapLength: 9,
});

// ---------- Визуальные параметры рыб ----------
const FISH_VISUAL_CONFIG = Object.freeze({
  imageDepth: 4,
  fallbackCircleDepth: 3,
  fallbackStrokeWidth: 4,
  fallbackStrokeAlpha: 0.58,
  shineOffsetX: 0.28,
  shineOffsetY: 0.3,
  shineWidthRatio: 0.42,
  shineHeightRatio: 0.2,
  shineAlpha: 0.48,
  labelMinimumSize: 24,
  labelSizeRatio: 0.78,
  labelDepth: 5,
  labelShadowOffsetY: 3,
  labelShadowBlur: 5,
  labelShadowColor: '#00699d',
  colliderDepth: 2,
  wobbleSpeedDivisor: 1.4,
  wobbleTimeFactor: 0.0022,
  wobbleAmplitude: 0.025,
  labelRotationFactor: 0.25,
  initialBubbleDelayMax: 300,
});

// ---------- Поверхность воды и декоративный фон ----------
const BACKDROP_CONFIG = Object.freeze({
  backgroundDepth: 0,
  seabedDepth: 0.5,
  seabedOriginX: 0.5,
  seabedOriginY: 1,
  surfaceDepth: 1,
  surfaceOriginX: 0.5,
  surfaceOriginY: 0.86,
  surfaceTopY: 0,
  surfaceAlpha: 0.82,
  bubbleLineWidth: 2,
  bubbleColor: 0xffffff,
  bubbleAlpha: 0.22,
  decorativeBubbles: [
    [68, 330, 7], [462, 405, 5], [102, 615, 4],
    [434, 690, 8], [160, 770, 5], [382, 525, 3],
  ],
});

// ---------- Тайминги интерфейса и служебных сценариев ----------
const TIMING_CONFIG = Object.freeze({
  initialSpawnDelay: 300,
  nextPreviewQaDelay: 450,
  unlockAnimationCleanup: 650,
  trailBubbleBaseInterval: 430,
  trailBubbleLevelInterval: 45,
});

// ---------- Эффекты объединения и пузырьков ----------
const EFFECTS_CONFIG = Object.freeze({
  mergeVelocityRetentionX: 0.45,
  mergeMinimumRiseVelocity: -0.8,
  mergeBounceStartScale: 0.72,
  mergeBounceDuration: 250,
  ringRadius: 18,
  ringStrokeWidth: 4,
  ringColor: 0xd9faff,
  ringAlpha: 0.85,
  ringDepth: 9,
  ringEndScale: 3.2,
  ringDuration: 420,
  mergeBubbleCount: 10,
  mergeBubbleMinRadius: 3,
  mergeBubbleMaxRadius: 6,
  mergeBubbleAlpha: 0.85,
  mergeBubbleDepth: 10,
  mergeBubbleMinDistance: 35,
  mergeBubbleMaxDistance: 57,
  mergeBubbleRiseOffset: 9,
  mergeBubbleEndScale: 0.25,
  mergeBubbleMinDuration: 300,
  mergeBubbleMaxDuration: 460,
  pointsOffsetY: 20,
  pointsEndOffsetY: 76,
  pointsFontSize: 22,
  pointsDepth: 11,
  pointsDuration: 650,
  pointsShadowOffsetY: 3,
  pointsShadowBlur: 6,
  pointsShadowColor: '#00699b',
  trailHorizontalRadiusRatio: 0.25,
  trailVerticalRadiusRatio: 0.72,
  trailMinRadius: 2,
  trailMaxRadius: 5,
  trailAlpha: 0.4,
  trailStrokeWidth: 1,
  trailStrokeAlpha: 0.5,
  trailDepth: 2,
  trailMinRise: 25,
  trailMaxRise: 48,
  trailHorizontalDrift: 8,
  trailEndScale: 0.5,
  trailMinDuration: 550,
  trailMaxDuration: 800,
  unlockBubbleCount: 5,
  unlockBubbleStartLeft: 32,
  unlockBubbleLeftStep: 9,
  unlockBubbleBottom: 10,
  unlockBubbleCenterIndex: 2,
  unlockBubbleDriftStep: 8,
  unlockBubbleDuration: 750,
});

// ---------- Отладочные сценарии ----------
const QA_CONFIG = Object.freeze({
  setupDelay: 120,
  mergeOffsetX: 62,
  levelOneMergeOffsetX: 23,
  mergeY: 410,
  mergeVelocityX: 0.25,
  mergeVelocityY: -0.2,
  gameOverLevelIndex: 2,
  gameOverOverlap: 5,
  progressionStartDelay: 700,
  progressionStepDelay: 650,
  pileLayout: [
    [0, 100, 235], [1, 170, 255], [2, 245, 250],
    [3, 335, 255], [4, 430, 245], [5, 275, 390],
  ],
});

const DEBUG_VIEW_CONFIG = Object.freeze({
  depth: 30,
  labelDepth: 31,
  labelX: 12,
  labelCreateOffsetY: 24,
  labelDrawOffsetY: 27,
  fontSize: 15,
  lineWidth: 2,
  lineColor: 0xff4968,
  lineAlpha: 0.95,
  labelColor: '#ffedf0',
  labelBackground: 'rgba(128, 0, 28, 0.72)',
  labelPaddingX: 7,
  labelPaddingY: 4,
});

const NUMBER_FORMAT_CONFIG = Object.freeze({
  normalizedCenter: 0.5,
  percentMultiplier: 100,
  decimalRadix: 10,
  fullCircle: Math.PI * 2,
});

const GAME_WIDTH = SCENE_CONFIG.width;
const WALL_SIZE = SCENE_CONFIG.wallSize;
const SURFACE_Y = SCENE_CONFIG.surfaceY;
const SOUND_ENABLED_KEY = 'fugu-merge-sound-enabled';
const AMBIENT_ENABLED_KEY = 'fugu-merge-ambient-enabled';
const URL_OPTIONS = new URLSearchParams(window.location.search);
const DEBUG_PHYSICS = URL_OPTIONS.has('debugPhysics');
const DEBUG_DISABLE_WORLD_GLOW = URL_OPTIONS.has('debugDisableGlow');
const QA_MAX_MERGE = URL_OPTIONS.has('qaMaxMerge');
const QA_CREATE_MAX_LEVEL = URL_OPTIONS.has('qaCreateMaxLevel');
const QA_PHYSICS_PILE = URL_OPTIONS.has('qaPhysicsPile');
const QA_GAME_OVER = URL_OPTIONS.has('qaGameOver');
const QA_PROGRESSION = URL_OPTIONS.has('qaProgression');
const QA_AUDIO_EVENTS = URL_OPTIONS.has('qaAudioEvents');
const QA_FISH_ANIMATION = URL_OPTIONS.has('qaFishAnimation');
const QA_LEVEL_ONE_MERGE = URL_OPTIONS.has('qaLevelOneMerge');
const QA_SHARK_DIRECTION = URL_OPTIONS.get('qaShark');
const QA_DEPTH_VARIANT = URL_OPTIONS.get('qaDepthVariant');
const QA_DEPTH_EFFECT = Boolean(QA_SHARK_DIRECTION || QA_DEPTH_VARIANT);
const QA_NEXT_LEVEL = Number.parseInt(
  URL_OPTIONS.get('qaNextLevel') || '',
  NUMBER_FORMAT_CONFIG.decimalRadix,
) - 1;
const QA_NEXT_PREVIEW_LEVEL = Number.parseInt(
  URL_OPTIONS.get('qaNextPreview') || '',
  NUMBER_FORMAT_CONFIG.decimalRadix,
) - 1;
const DEBUG_GAME_OVER_LINE = URL_OPTIONS.has('debugGameOverLine');
const QA_MODE = [...URL_OPTIONS.keys()].some((key) => key.startsWith('qa'));
const maxLevelIndex = () => FRUITS.length - 1;
const CONTROL_STATES = Object.freeze({
  WAITING: 'waiting',
  DRAGGING: 'dragging',
  RELEASED: 'released',
});

function viewportSize() {
  const viewport = window.visualViewport;
  return {
    width: Math.max(1, viewport?.width || window.innerWidth),
    height: Math.max(1, viewport?.height || window.innerHeight),
  };
}

function calculateGameHeight() {
  const { width, height } = viewportSize();
  if (width > SCENE_CONFIG.mobileBreakpoint) return SCENE_CONFIG.desktopHeight;
  return Math.max(SCENE_CONFIG.minimumMobileHeight, Math.round((GAME_WIDTH * height) / width));
}

let gameHeight = calculateGameHeight();
const spawnY = () => gameHeight - SCENE_CONFIG.spawnBottomOffset;

const progressionElement = document.querySelector('#progression');

const worldName = (world) => t(world.nameKey);
const worldDescription = (world) => t(world.descriptionKey);
const characterName = (character) => t(character.nameKey);
const characterTrait = (character) => t(character.characterKey);
const characterDescription = (character) => t(character.descriptionKey);

function rebuildProgressionSlots() {
  progressionElement.replaceChildren();
  FRUITS.forEach((config, index) => {
    const slot = document.createElement('div');
    slot.className = `progress-slot${index === 0 ? ' is-unlocked' : ''}`;
    slot.dataset.level = String(config.level);
    slot.setAttribute(
      'aria-label',
      t(index === 0 ? 'a11y.progressOpen' : 'a11y.progressLocked', { level: config.level }),
    );
    progressionElement.appendChild(slot);
  });
}

rebuildProgressionSlots();

const ui = {
  gameWrap: document.querySelector('#game-wrap'),
  score: document.querySelector('#score'),
  hudBestScore: document.querySelector('#hud-best-score'),
  nextFish: document.querySelector('#next-fruit'),
  controlHint: document.querySelector('#control-hint'),
  warning: document.querySelector('#warning'),
  mainMenu: document.querySelector('#main-menu'),
  mainMenuWorld: document.querySelector('#main-menu-world'),
  mainMenuProgress: document.querySelector('#main-menu-progress'),
  playButton: document.querySelector('#play-button'),
  worldsButton: document.querySelector('#worlds-button'),
  atlasButton: document.querySelector('#atlas-button'),
  mainSoundToggleButton: document.querySelector('#main-sound-toggle-button'),
  settingsButton: document.querySelector('#settings-button'),
  settingsModal: document.querySelector('#settings-modal'),
  settingsCloseButton: document.querySelector('#settings-close-button'),
  worldsModal: document.querySelector('#worlds-modal'),
  worldsCloseButton: document.querySelector('#worlds-close-button'),
  worldsGrid: document.querySelector('#worlds-grid'),
  pauseButton: document.querySelector('#pause-button'),
  pauseModal: document.querySelector('#pause-modal'),
  continueButton: document.querySelector('#continue-button'),
  soundToggleButton: document.querySelector('#sound-toggle-button'),
  soundToggleText: document.querySelector('#sound-toggle-text'),
  ambientToggleButton: document.querySelector('#ambient-toggle-button'),
  ambientToggleText: document.querySelector('#ambient-toggle-text'),
  languageButton: document.querySelector('#language-button'),
  currentLanguageName: document.querySelector('#current-language-name'),
  languageModal: document.querySelector('#language-modal'),
  languageCloseButton: document.querySelector('#language-close-button'),
  languageList: document.querySelector('#language-list'),
  pauseRestartButton: document.querySelector('#pause-restart-button'),
  pauseSettingsButton: document.querySelector('#pause-settings-button'),
  pauseWorldsButton: document.querySelector('#pause-worlds-button'),
  gameOver: document.querySelector('#game-over'),
  finalScore: document.querySelector('#final-score'),
  bestScore: document.querySelector('#best-score'),
  newRecordBadge: document.querySelector('#new-record-badge'),
  restartButton: document.querySelector('#restart-button'),
  gameOverMenuButton: document.querySelector('#game-over-menu-button'),
  progression: progressionElement,
  progressSlots: [...progressionElement.querySelectorAll('.progress-slot')],
  atlasModal: document.querySelector('#atlas-modal'),
  atlasGrid: document.querySelector('#atlas-grid'),
  atlasWorldTabs: document.querySelector('#atlas-world-tabs'),
  atlasCloseButton: document.querySelector('#atlas-close-button'),
  fishDetailModal: document.querySelector('#fish-detail-modal'),
  fishDetailImage: document.querySelector('#fish-detail-image'),
  fishDetailLevel: document.querySelector('#fish-detail-level'),
  fishDetailName: document.querySelector('#fish-detail-name'),
  fishDetailCharacter: document.querySelector('#fish-detail-character'),
  fishDetailDescription: document.querySelector('#fish-detail-description'),
  fishDetailCloseButton: document.querySelector('#fish-detail-close-button'),
  fishUnlockModal: document.querySelector('#fish-unlock-modal'),
  fishUnlockImage: document.querySelector('#fish-unlock-image'),
  fishUnlockName: document.querySelector('#fish-unlock-name'),
  fishUnlockDescription: document.querySelector('#fish-unlock-description'),
};

const warnedProgressAssets = new Set();
const warnedAtlasAssets = new Set();
// Два ближайших PNG: прогреваем DOM decode, не держим вторую коллекцию текстур.
const preparedUnlockImages = new Map();
function prepareUnlockImage(path) {
  if (preparedUnlockImages.has(path)) return preparedUnlockImages.get(path).ready;
  const image = new Image();
  image.src = path;
  const ready = (image.decode ? image.decode() : new Promise((resolve) => {
    if (image.complete) resolve();
    else { image.onload = resolve; image.onerror = resolve; }
  })).catch(() => {});
  preparedUnlockImages.set(path, { image, ready });
  if (preparedUnlockImages.size > 2) preparedUnlockImages.delete(preparedUnlockImages.keys().next().value);
  return ready;
}
let warnedMissingLevelOneAnimation = false;
const warnedMissingDepthAssets = new Set();
// Флаг живёт до перезагрузки страницы и не сбрасывается при рестарте Phaser-сцены.
let hasCompletedFirstDrop = false;

function readBestScore() {
  try {
    const worldKey = bestScoreStorageKey(activeWorldId);
    const saved = localStorage.getItem(worldKey);
    if (saved !== null) return Number(saved) || 0;
    // Миграция прежнего общего рекорда в мир фугу.
    const legacy = activeWorldId === 'fugu'
      ? Number(localStorage.getItem(LEGACY_BEST_SCORE_KEY)) || 0
      : 0;
    if (legacy) localStorage.setItem(worldKey, String(legacy));
    return legacy;
  } catch {
    return 0;
  }
}

function saveBestScore(value) {
  try {
    localStorage.setItem(bestScoreStorageKey(activeWorldId), String(value));
  } catch {
    // Игра продолжит работать, даже если браузер запретил локальное хранилище.
  }
}

function readSoundEnabled() {
  try {
    const savedValue = localStorage.getItem(SOUND_ENABLED_KEY);
    return savedValue === null ? AUDIO.enabled : savedValue !== 'false';
  } catch {
    return AUDIO.enabled;
  }
}

function saveSoundEnabled(value) {
  try {
    localStorage.setItem(SOUND_ENABLED_KEY, String(value));
  } catch {
    // Игра продолжит работать, даже если браузер запретил локальное хранилище.
  }
}

function readAmbientEnabled() {
  try {
    const savedValue = localStorage.getItem(AMBIENT_ENABLED_KEY);
    return savedValue === null ? AUDIO.ambientEnabled : savedValue !== 'false';
  } catch {
    return AUDIO.ambientEnabled;
  }
}

function saveAmbientEnabled(value) {
  try {
    localStorage.setItem(AMBIENT_ENABLED_KEY, String(value));
  } catch {
    // Игра продолжит работать, даже если браузер запретил локальное хранилище.
  }
}

function readCollectionLevels(world = activeWorld) {
  try {
    const worldKey = collectionStorageKey(world.id);
    let raw = localStorage.getItem(worldKey);
    if (raw === null && world.id === 'fugu') raw = localStorage.getItem(LEGACY_COLLECTION_KEY);
    const savedLevels = JSON.parse(raw || '[]');
    const validLevels = Array.isArray(savedLevels)
      ? savedLevels.filter((level) => Number.isInteger(level) && level >= 1 && level <= world.characters.length)
      : [];
    const levels = new Set([0, ...validLevels.map((level) => level - 1)]);
    if (raw !== null) saveCollectionLevels(levels, world.id);
    return levels;
  } catch {
    return new Set([0]);
  }
}

function saveCollectionLevels(levelIndexes, worldId = activeWorldId) {
  try {
    const savedLevels = [...levelIndexes]
      .sort((firstLevel, secondLevel) => firstLevel - secondLevel)
      .map((levelIndex) => levelIndex + 1);
    localStorage.setItem(collectionStorageKey(worldId), JSON.stringify(savedLevels));
    localStorage.setItem(highestLevelStorageKey(worldId), String(Math.max(...savedLevels, 1)));
  } catch {
    // Игра и атлас продолжат работать, даже если браузер запретил localStorage.
  }
}

class FruitScene extends Phaser.Scene {
  // ======================== Инициализация сцены ========================

  constructor() {
    super('FruitScene');
    this.world = activeWorld;
    this.atlasWorldId = activeWorldId;
    this.fruits = new Map();
    this.dangerSince = new Map();
    this.touchingSurface = new Set();
    this.pendingMerges = [];
    this.boundBodies = [];
    this.seabed = null;
    this.shark = null;
    this.sharkTween = null;
    this.sharkCheckTimer = null;
    this.sharkFailedChecks = 0;
    this.availableDepthVariants = [];
    this.lastDepthVariantId = null;
    this.gameOverLineY = spawnY() - SCENE_CONFIG.gameOverOffsetAboveSpawn;
    this.gameOverLimitGraphics = null;
    this.gameOverDebugGraphics = null;
    this.gameOverDebugLabel = null;
    this.unlockedLevels = new Set([0]);
    this.collectionUnlockedLevels = readCollectionLevels();
    saveCollectionLevels(this.collectionUnlockedLevels);
    this.atlasWasRunning = false;
    this.unlockDismissTimer = 0;
    this.unlockAutoCloseTimer = 0;
    this.unlockCanDismissAt = 0;
    this.score = 0;
    this.bestScore = 0;
    this.currentFruit = null;
    this.nextLevel = 0;
    this.canDrop = false;
    this.controlState = CONTROL_STATES.RELEASED;
    this.activePointerId = null;
    this.activeNativePointerId = null;
    this.dragOffsetX = 0;
    this.lastDragX = GAME_WIDTH / 2;
    this.gameEnded = false;
    this.isPaused = false;
    this.isMainMenuOpen = true;
    this.sounds = null;
    this.ambientSound = null;
    this.ambientTween = null;
    this.soundEnabled = readSoundEnabled();
    this.ambientEnabled = readAmbientEnabled();
    this.audioUnlocked = false;
    this.audioUnlockPromise = null;
    this.handleAudioUnlock = null;
    this.handleSoundManagerUnlocked = null;
    this.handleAudioVisibilityChange = null;
    this.handleAudioPageShow = null;
    this.hasWarnedSuspendedAudio = false;
    this.handleAssetLoadError = (file) => {
      console.warn('[Ресурсы] Не удалось загрузить файл:', file.key, file.src);
    };
    this.recordSoundPlayed = false;
    this.gameOverSoundPlayed = false;
    this.stoppedBlinkAnimationCount = 0;
    this.stoppedIdleAnimationCount = 0;
    ui.gameWrap.dataset.world = activeWorldId;
    ui.gameWrap.classList.remove('world-fugu', 'world-jellyfish');
    ui.gameWrap.classList.add(activeWorld.themeClass);
  }

  preload() {
    this.load.off('loaderror', this.handleAssetLoadError);
    this.load.on('loaderror', this.handleAssetLoadError);

    // Все изображения из единой конфигурации загружаются заранее; при ошибке используется fallback-круг.
    Object.values(WORLDS).forEach((world) => {
      world.characters.forEach((config) => {
        this.load.image(config.textureKey, config.texturePath);
      });
      this.load.image(world.backgrounds.seabedKey, world.backgrounds.seabedPath);
      this.load.image(world.backgrounds.surfaceKey, world.backgrounds.surfacePath);
      world.backgroundEvents.forEach((variant) => {
        this.load.image(variant.textureKey, variant.texturePath);
      });
    });
    this.load.svg(GLOW_SPHERE_TEXTURE_KEY, GLOW_SPHERE_TEXTURE_PATH, { width: 256, height: 256 });
    this.load.image(FISH_ANIMATION.bodyTextureKey, FISH_ANIMATION.bodyTexturePath);
    this.load.image(FISH_ANIMATION.eyesClosedTextureKey, FISH_ANIMATION.eyesClosedTexturePath);
    // Универсальная закрытая рыба загружается один раз и переиспользуется во всех слотах.
    this.load.image(activeWorld.lockedTextureKey, activeWorld.lockedTexturePath);
    Object.values(AUDIO.files).forEach(({ key, path }) => this.load.audio(key, path));
    this.load.audio(AUDIO.ambientKey, AUDIO.ambientPath);
  }

  create() {
    this.world = activeWorld;
    this.atlasWorldId = activeWorldId;
    this.fruits = new Map();
    this.dangerSince = new Map();
    this.touchingSurface = new Set();
    this.pendingMerges = [];
    this.boundBodies = [];
    this.seabed = null;
    this.shark = null;
    this.sharkTween = null;
    this.sharkCheckTimer = null;
    this.sharkFailedChecks = 0;
    this.availableDepthVariants = [];
    this.lastDepthVariantId = null;
    this.gameOverLineY = spawnY() - SCENE_CONFIG.gameOverOffsetAboveSpawn;
    this.gameOverLimitGraphics = null;
    this.gameOverDebugGraphics = null;
    this.gameOverDebugLabel = null;
    this.unlockedLevels = new Set([0]);
    this.collectionUnlockedLevels = readCollectionLevels();
    this.atlasWasRunning = false;
    window.clearTimeout(this.unlockDismissTimer);
    window.clearTimeout(this.unlockAutoCloseTimer);
    this.unlockDismissTimer = 0;
    this.unlockAutoCloseTimer = 0;
    this.unlockCanDismissAt = 0;
    this.score = 0;
    this.bestScore = readBestScore();
    this.currentFruit = null;
    this.canDrop = false;
    this.controlState = CONTROL_STATES.RELEASED;
    this.activePointerId = null;
    this.activeNativePointerId = null;
    this.dragOffsetX = 0;
    this.lastDragX = GAME_WIDTH / 2;
    this.gameEnded = false;
    this.isPaused = false;
    this.isMainMenuOpen = true;
    this.soundEnabled = readSoundEnabled();
    this.ambientEnabled = readAmbientEnabled();
    this.recordSoundPlayed = false;
    this.gameOverSoundPlayed = false;
    this.stoppedBlinkAnimationCount = 0;
    ui.gameWrap.dataset.world = activeWorldId;
    ui.gameWrap.classList.remove('world-fugu', 'world-jellyfish');
    ui.gameWrap.classList.add(activeWorld.themeClass);

    this.time.paused = false;
    this.matter.world.resume();
    this.initializeSounds();
    this.installAudioUnlock();
    Object.values(WORLDS).forEach((world) => world.characters.forEach((config) => {
      if (this.textures.exists(config.textureKey)) {
        this.textures.get(config.textureKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }));
    if (this.textures.exists(GLOW_SPHERE_TEXTURE_KEY)) {
      this.textures.get(GLOW_SPHERE_TEXTURE_KEY).setFilter(Phaser.Textures.FilterMode.LINEAR);
    }
    [
      FISH_ANIMATION.bodyTextureKey,
      FISH_ANIMATION.eyesClosedTextureKey,
    ].forEach((textureKey) => {
      if (this.textures.exists(textureKey)) {
        this.textures.get(textureKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    });
    if (this.textures.exists(activeWorld.lockedTextureKey)) {
      this.textures.get(activeWorld.lockedTextureKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
    } else {
      this.warnProgressAssetOnce(
        activeWorld.lockedTextureKey,
        `Не удалось загрузить ${activeWorld.lockedTexturePath}. Используется запасной тёмно-синий круг со знаком вопроса.`,
      );
    }
    this.resetInterface();
    this.unlockRevealRevision = (this.unlockRevealRevision || 0) + 1;
    if (FRUITS[1]) void prepareUnlockImage(FRUITS[1].texturePath);
    this.createBackdrop();
    this.startSharkCycle();
    this.scale.on('resize', this.handleGameResize, this);
    this.handleWindowPointerUp = (event) => {
      if (this.controlState !== CONTROL_STATES.DRAGGING) return;
      if (this.activeNativePointerId !== null && event.pointerId !== this.activeNativePointerId) return;
      this.releaseCurrentFruit();
    };
    this.handlePointerCancel = () => this.cancelCurrentFruitDrag();
    this.handleWindowBlur = () => this.cancelCurrentFruitDrag();
    window.addEventListener('pointerup', this.handleWindowPointerUp);
    window.addEventListener('pointercancel', this.handlePointerCancel);
    window.addEventListener('touchcancel', this.handlePointerCancel, { passive: false });
    window.addEventListener('blur', this.handleWindowBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unlockRevealRevision += 1;
      this.disposeWorldCharacterEffectsForShutdown();
      this.scale.off('resize', this.handleGameResize, this);
      window.removeEventListener('pointerup', this.handleWindowPointerUp);
      window.removeEventListener('pointercancel', this.handlePointerCancel);
      window.removeEventListener('touchcancel', this.handlePointerCancel);
      window.removeEventListener('blur', this.handleWindowBlur);
      this.removeAudioUnlockListeners();
      document.removeEventListener('visibilitychange', this.handleAudioVisibilityChange);
      window.removeEventListener('pageshow', this.handleAudioPageShow);
      if (this.handleSoundManagerUnlocked) {
        this.sound.off('unlocked', this.handleSoundManagerUnlocked);
      }
      this.load.off('loaderror', this.handleAssetLoadError);
      this.stopAmbientTween();
      this.stopSharkEffect();
      window.clearTimeout(this.unlockDismissTimer);
      window.clearTimeout(this.unlockAutoCloseTimer);
    });
    this.createInvisibleBounds();

    this.matter.world.engine.positionIterations = PHYSICS_CONFIG.positionIterations;
    this.matter.world.engine.velocityIterations = PHYSICS_CONFIG.velocityIterations;
    this.matter.world.on('collisionstart', this.handleCollisions, this);
    this.matter.world.on('collisionend', this.handleCollisionEnd, this);
    this.input.on('pointerdown', this.beginCurrentFruitDrag, this);
    this.input.on('pointermove', this.dragCurrentFruit, this);
    this.input.on('pointerup', this.releaseCurrentFruit, this);
    this.input.on('pointerupoutside', this.releaseCurrentFruit, this);
    this.input.on('pointercancel', this.cancelCurrentFruitDrag, this);

    this.nextLevel = Number.isInteger(QA_NEXT_LEVEL) && QA_NEXT_LEVEL >= 0 && QA_NEXT_LEVEL < FRUITS.length
      ? QA_NEXT_LEVEL
      : this.randomStartingLevel();
    this.updateNextPreview();
    this.time.delayedCall(TIMING_CONFIG.initialSpawnDelay, () => this.spawnFruit());
    if (Number.isInteger(QA_NEXT_PREVIEW_LEVEL) && QA_NEXT_PREVIEW_LEVEL >= 0 && QA_NEXT_PREVIEW_LEVEL < FRUITS.length) {
      this.time.delayedCall(TIMING_CONFIG.nextPreviewQaDelay, () => {
        this.nextLevel = QA_NEXT_PREVIEW_LEVEL;
        this.updateNextPreview();
      });
    }
    if (QA_MAX_MERGE) this.setupMaxMergeQa();
    if (QA_CREATE_MAX_LEVEL) this.setupCreateMaxLevelQa();
    if (QA_PHYSICS_PILE) this.setupPhysicsPileQa();
    if (QA_GAME_OVER) this.setupGameOverQa();
    if (QA_PROGRESSION) this.setupProgressionQa();
    if (QA_LEVEL_ONE_MERGE) this.setupLevelOneMergeQa();
    if (forceMainMenuAfterRestart) {
      forceMainMenuAfterRestart = false;
      startSceneWithoutMainMenu = false;
      this.openMainMenu();
    } else if (QA_MODE || startSceneWithoutMainMenu) {
      startSceneWithoutMainMenu = false;
      this.closeMainMenu();
    } else {
      this.openMainMenu();
    }
    // Заставка скрывается после готовности сцены и первого отрисованного кадра.
    this.game.events.once(Phaser.Core.Events.POST_RENDER, () => { void hideNativeSplash(); });
  }

  // ======================== Звуки ========================

  initializeSounds() {
    if (!this.sounds) {
      this.sound.setVolume(AUDIO.masterVolume);
      this.sounds = Object.fromEntries(
        Object.entries(AUDIO.files).map(([name, { key, volume }]) => [
          name,
          this.cache.audio.exists(key)
            ? this.sound.add(key, { volume: AUDIO[volume] })
            : null,
        ]),
      );
    }
    const ambientKey = this.world.ambientSound || AUDIO.ambientKey;
    if (!this.ambientSound && this.cache.audio.exists(ambientKey)) {
      this.ambientSound = this.sound.add(ambientKey, {
        loop: true,
        volume: 0,
      });
    }

    if (this.handleSoundManagerUnlocked) {
      this.sound.off('unlocked', this.handleSoundManagerUnlocked);
    }
    this.handleSoundManagerUnlocked = () => {
      const context = this.sound?.context;
      if (context && context.state !== 'running') return;
      this.markAudioUnlocked('Phaser Sound Manager unlocked');
    };
    this.sound.once('unlocked', this.handleSoundManagerUnlocked);
  }

  installAudioUnlock() {
    if (!this.handleAudioVisibilityChange) {
      this.handleAudioVisibilityChange = () => {
        if (document.hidden) this.pauseAmbient();
        this.refreshAudioContextState(true);
      };
    }
    if (!this.handleAudioPageShow) {
      this.handleAudioPageShow = () => {
        this.pauseAmbient();
        this.refreshAudioContextState(true);
      };
    }
    document.removeEventListener('visibilitychange', this.handleAudioVisibilityChange);
    window.removeEventListener('pageshow', this.handleAudioPageShow);
    document.addEventListener('visibilitychange', this.handleAudioVisibilityChange);
    window.addEventListener('pageshow', this.handleAudioPageShow);

    if (this.audioUnlocked || this.handleAudioUnlock) return;
    this.handleAudioUnlock = () => {
      // Вызов resume начинается синхронно внутри пользовательского жеста — это важно для iOS Safari.
      void this.unlockAudio();
    };
    window.addEventListener('pointerdown', this.handleAudioUnlock, { capture: true, passive: true });
    window.addEventListener('touchstart', this.handleAudioUnlock, { capture: true, passive: true });
    window.addEventListener('click', this.handleAudioUnlock, { capture: true, passive: true });

  }

  async unlockAudio() {
    if (this.audioUnlocked) return true;
    if (this.audioUnlockPromise) return this.audioUnlockPromise;

    const context = this.sound?.context;
    const unlockPromise = (async () => {
      try {
        if (this.sound?.locked) this.sound.unlock?.();
        if (context && context.state !== 'running') await context.resume?.();

        const unlocked = !context || context.state === 'running';
        if (unlocked) {
          this.markAudioUnlocked('Audio unlocked');
        } else {
          this.audioUnlocked = false;
          console.warn('[Audio] Unlock failed: AudioContext state is', context.state);
        }
        return unlocked;
      } catch (error) {
        this.audioUnlocked = false;
        console.warn('[Audio] Unlock failed:', error);
        return false;
      }
    })();
    this.audioUnlockPromise = unlockPromise;

    try {
      return await unlockPromise;
    } finally {
      if (this.audioUnlockPromise === unlockPromise) this.audioUnlockPromise = null;
    }
  }

  markAudioUnlocked(message) {
    if (this.audioUnlocked) return;
    this.audioUnlocked = true;
    this.hasWarnedSuspendedAudio = false;
    this.removeAudioUnlockListeners();
    if (QA_AUDIO_EVENTS) {
      ui.gameWrap.dataset.qaAudioUnlocked = 'true';
      ui.gameWrap.dataset.qaAudioContextState = this.sound?.context?.state || 'html5-audio';
    }
    console.info(`[Audio] ${message}`);
    this.startAmbient();
  }

  refreshAudioContextState(forceGestureCheck = false) {
    const context = this.sound?.context;
    if (!context) {
      this.audioUnlocked = !forceGestureCheck;
      if (forceGestureCheck) this.installAudioUnlock();
      return;
    }

    if (context.state !== 'running' || forceGestureCheck) {
      this.audioUnlocked = false;
      if (QA_AUDIO_EVENTS) {
        ui.gameWrap.dataset.qaAudioUnlocked = 'false';
        ui.gameWrap.dataset.qaAudioContextState = context.state;
      }
      this.installAudioUnlock();
    }
  }

  removeAudioUnlockListeners() {
    if (!this.handleAudioUnlock) return;
    window.removeEventListener('pointerdown', this.handleAudioUnlock, true);
    window.removeEventListener('touchstart', this.handleAudioUnlock, true);
    window.removeEventListener('click', this.handleAudioUnlock, true);
    this.handleAudioUnlock = null;
  }

  playSound(name) {
    if (!this.soundEnabled || this.nativeInBackground) return false;
    const sound = this.sounds?.[name];
    if (!sound) return false;
    if (this.sound?.mute) return false;

    const context = this.sound?.context;
    if (context && context.state !== 'running') {
      if (this.audioUnlockPromise) {
        void this.audioUnlockPromise.then((unlocked) => {
          if (unlocked) this.playSound(name);
        });
        return false;
      }

      this.audioUnlocked = false;
      this.installAudioUnlock();
      if (!this.hasWarnedSuspendedAudio) {
        this.hasWarnedSuspendedAudio = true;
        console.warn('[Audio] Sound skipped: AudioContext is', context.state);
      }
      return false;
    }
    if (QA_AUDIO_EVENTS) {
      const previousEvents = ui.gameWrap.dataset.qaAudioEvents;
      ui.gameWrap.dataset.qaAudioEvents = previousEvents ? `${previousEvents},${name}` : name;
    }
    return sound.play();
  }

  setSoundEnabled(value) {
    this.soundEnabled = Boolean(value);
    if (!this.soundEnabled) {
      Object.values(this.sounds || {}).forEach((sound) => sound?.stop());
      this.fadeOutAmbient();
    } else {
      this.startAmbient();
    }
    saveSoundEnabled(this.soundEnabled);
    this.updateSoundToggleInterface();
    return this.soundEnabled;
  }

  updateSoundToggleInterface() {
    const isEnabled = this.soundEnabled;
    ui.soundToggleButton.setAttribute('aria-pressed', String(isEnabled));
    ui.soundToggleButton.setAttribute('aria-label', t(isEnabled ? 'a11y.soundOff' : 'a11y.soundOn'));
    ui.soundToggleText.textContent = t('settings.sound');
    ui.mainSoundToggleButton.setAttribute('aria-pressed', String(isEnabled));
    ui.mainSoundToggleButton.setAttribute('aria-label', t(isEnabled ? 'a11y.soundOff' : 'a11y.soundOn'));
  }

  enableSound() {
    return this.setSoundEnabled(true);
  }

  disableSound() {
    return this.setSoundEnabled(false);
  }

  toggleSound() {
    return this.setSoundEnabled(!this.soundEnabled);
  }

  // ---------- Зацикленный подводный эмбиент ----------

  setAmbientEnabled(value) {
    this.ambientEnabled = Boolean(value);
    saveAmbientEnabled(this.ambientEnabled);
    this.updateAmbientToggleInterface();
    if (this.ambientEnabled) this.startAmbient();
    else this.fadeOutAmbient();
    return this.ambientEnabled;
  }

  updateAmbientToggleInterface() {
    const isEnabled = this.ambientEnabled;
    ui.ambientToggleButton.setAttribute('aria-pressed', String(isEnabled));
    ui.ambientToggleButton.setAttribute('aria-label', t(isEnabled ? 'a11y.ambientOff' : 'a11y.ambientOn'));
    ui.ambientToggleText.textContent = t('settings.ambient');
  }

  ambientTargetVolume() {
    if (this.gameEnded) return AUDIO.ambientVolume * AUDIO.ambientGameOverVolumeRatio;
    if (this.isPaused) return AUDIO.ambientVolume * AUDIO.ambientPauseVolumeRatio;
    return AUDIO.ambientVolume;
  }

  stopAmbientTween() {
    this.ambientTween?.stop();
    this.ambientTween = null;
  }

  fadeAmbientTo(targetVolume, duration) {
    if (!this.ambientSound) return;
    this.stopAmbientTween();
    const tween = this.tweens.add({
      targets: this.ambientSound,
      volume: targetVolume,
      duration,
      ease: 'Sine.InOut',
      onComplete: () => {
        if (this.ambientTween === tween) this.ambientTween = null;
        if (QA_AUDIO_EVENTS) ui.gameWrap.dataset.qaAmbientVolume = String(targetVolume);
      },
    });
    this.ambientTween = tween;
  }

  startAmbient() {
    if (this.nativeInBackground) return false;
    if (!this.ambientSound || !this.soundEnabled || !this.ambientEnabled || !this.audioUnlocked) return false;
    if (document.hidden || this.sound?.mute) return false;
    const context = this.sound?.context;
    if (context && context.state !== 'running') return false;

    if (this.ambientSound.isPaused) {
      this.ambientSound.resume();
    } else if (!this.ambientSound.isPlaying) {
      this.ambientSound.setVolume(0);
      if (!this.ambientSound.play()) return false;
    }

    const targetVolume = this.ambientTargetVolume();
    const duration = this.ambientSound.volume > targetVolume
      ? AUDIO.ambientFadeOutMs
      : AUDIO.ambientFadeInMs;
    this.fadeAmbientTo(targetVolume, duration);
    if (QA_AUDIO_EVENTS) {
      ui.gameWrap.dataset.qaAmbientState = 'playing';
      ui.gameWrap.dataset.qaAmbientTargetVolume = String(targetVolume);
    }
    return true;
  }

  pauseAmbient() {
    if (!this.ambientSound) return;
    this.stopAmbientTween();
    this.ambientSound.setVolume(0);
    if (this.ambientSound.isPlaying) this.ambientSound.pause();
    if (QA_AUDIO_EVENTS) ui.gameWrap.dataset.qaAmbientState = 'paused';
  }

  fadeOutAmbient() {
    if (!this.ambientSound) return;
    this.stopAmbientTween();
    if (!this.ambientSound.isPlaying) {
      this.ambientSound.setVolume(0);
      return;
    }

    const ambientSound = this.ambientSound;
    if (QA_AUDIO_EVENTS) ui.gameWrap.dataset.qaAmbientState = 'fading-out';
    const tween = this.tweens.add({
      targets: ambientSound,
      volume: 0,
      duration: AUDIO.ambientFadeOutMs,
      ease: 'Sine.InOut',
      onComplete: () => {
        if (ambientSound.isPlaying) ambientSound.pause();
        if (this.ambientTween === tween) this.ambientTween = null;
        if (QA_AUDIO_EVENTS) {
          ui.gameWrap.dataset.qaAmbientState = 'paused';
          ui.gameWrap.dataset.qaAmbientVolume = '0';
        }
      },
    });
    this.ambientTween = tween;
  }

  // ======================== Панель прогрессии ========================

  unlockAllLevelsForQa() {
    this.unlockedLevels = new Set(FRUITS.map((_, index) => index));
    this.renderProgression();
  }

  warnProgressAssetOnce(key, message) {
    if (warnedProgressAssets.has(key)) return;
    warnedProgressAssets.add(key);
    console.warn(`[Панель прогрессии] ${message}`);
  }

  createProgressImage(src, alt, scale, config = null) {
    const image = document.createElement('img');
    image.className = 'progress-fish';
    image.src = src;
    image.alt = alt;
    image.draggable = false;
    image.style.setProperty('--progress-scale', String(scale));
    if (config) {
      image.style.setProperty(
        '--progress-offset-x',
        `${(NUMBER_FORMAT_CONFIG.normalizedCenter - config.originX) * NUMBER_FORMAT_CONFIG.percentMultiplier}%`,
      );
      image.style.setProperty(
        '--progress-offset-y',
        `${(NUMBER_FORMAT_CONFIG.normalizedCenter - config.originY) * NUMBER_FORMAT_CONFIG.percentMultiplier}%`,
      );
    }
    return image;
  }

  createProgressFallback(config, isLocked) {
    const fallback = document.createElement('span');
    fallback.className = `progress-fallback${isLocked ? ' is-locked' : ''}`;
    fallback.style.setProperty('--fallback-color', isLocked ? '#123b68' : config.cssColor);
    fallback.textContent = isLocked ? '?' : '';
    fallback.setAttribute('aria-hidden', 'true');
    return fallback;
  }

  renderProgressSlot(levelIndex, animate = false) {
    const slot = ui.progressSlots[levelIndex];
    const config = FRUITS[levelIndex];
    const isUnlocked = this.unlockedLevels.has(levelIndex);
    slot.replaceChildren();
    slot.classList.toggle('is-unlocked', isUnlocked);
    slot.classList.remove('just-unlocked');
    slot.setAttribute(
      'aria-label',
      t(isUnlocked ? 'a11y.progressOpen' : 'a11y.progressLocked', { level: config.level }),
    );

    let visual;
    if (isUnlocked && this.textures.exists(config.textureKey)) {
      visual = this.createProgressImage(
        config.texturePath,
        t('a11y.openCharacterImage', { level: config.level }),
        config.progressScale ?? 1,
        config,
      );
      visual.addEventListener('error', () => {
        this.warnProgressAssetOnce(config.textureKey, `Не удалось показать ${config.texturePath}. Для уровня ${config.level} используется цветной круг.`);
        visual.replaceWith(this.createProgressFallback(config, false));
      }, { once: true });
    } else if (!isUnlocked && this.textures.exists(this.world.lockedTextureKey)) {
      visual = this.createProgressImage(
        this.world.lockedTexturePath,
        t('a11y.lockedCharacterImage', { level: config.level }),
        PROGRESS_UI.lockedFishScale,
      );
      visual.addEventListener('error', () => {
        this.warnProgressAssetOnce(this.world.lockedTextureKey, `Не удалось показать ${this.world.lockedTexturePath}. Используется запасной тёмно-синий круг со знаком вопроса.`);
        visual.replaceWith(this.createProgressFallback(config, true));
      }, { once: true });
    } else {
      if (isUnlocked) {
        this.warnProgressAssetOnce(config.textureKey, `Не удалось загрузить ${config.texturePath}. Для уровня ${config.level} используется цветной круг.`);
      }
      visual = this.createProgressFallback(config, !isUnlocked);
    }

    slot.appendChild(visual);
    if (animate) {
      // Класс добавляется после вставки изображения, чтобы анимация всегда стартовала с 0.75.
      window.requestAnimationFrame(() => slot.classList.add('just-unlocked'));
      window.setTimeout(() => slot.classList.remove('just-unlocked'), TIMING_CONFIG.unlockAnimationCleanup);
    }
  }

  renderProgression() {
    ui.progression.style.setProperty('--progress-fish-size', `${PROGRESS_UI.progressFishSize}px`);
    ui.progressSlots.forEach((_, index) => this.renderProgressSlot(index));
  }

  // ======================== Подводный атлас ========================

  configureAtlasImage(image, primaryPath, fallbackPath, alt) {
    image.hidden = false;
    image.dataset.usedFallback = 'false';
    image.alt = alt;
    image.draggable = false;
    image.onerror = () => {
      if (image.dataset.usedFallback === 'true') {
        image.hidden = true;
        return;
      }
      image.dataset.usedFallback = 'true';
      image.src = fallbackPath;
      if (!warnedAtlasAssets.has(primaryPath)) {
        warnedAtlasAssets.add(primaryPath);
        console.warn(`[Подводный атлас] Не удалось загрузить ${primaryPath}. Используется запасное изображение.`);
      }
    };
    image.src = primaryPath;
  }

  renderAtlas() {
    ui.atlasGrid.replaceChildren();
    ui.atlasWorldTabs.replaceChildren();
    const atlasWorld = WORLDS[this.atlasWorldId] || this.world;
    const atlasCollection = readCollectionLevels(atlasWorld);

    Object.values(WORLDS).forEach((world) => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = `atlas-world-tab glass glass-button glass-button-tertiary${world.id === atlasWorld.id ? ' is-selected' : ''}`;
      tab.textContent = worldName(world);
      tab.addEventListener('click', () => {
        this.playSound('button');
        this.atlasWorldId = world.id;
        this.renderAtlas();
      });
      ui.atlasWorldTabs.appendChild(tab);
    });

    atlasWorld.characters.forEach((fishData, levelIndex) => {
      const isUnlocked = atlasCollection.has(levelIndex);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `atlas-fish-card${isUnlocked ? ' is-unlocked' : ' is-locked'}`;
      card.disabled = !isUnlocked;
      card.dataset.level = String(fishData.level);
      card.style.setProperty('--atlas-index', String(levelIndex));
      card.setAttribute(
        'aria-label',
        isUnlocked
          ? t('a11y.atlasOpenCard', { name: characterName(fishData), level: fishData.level })
          : t('a11y.atlasLockedCard', { level: fishData.level }),
      );

      const imageWrap = document.createElement('span');
      imageWrap.className = 'atlas-fish-image-wrap';
      const image = document.createElement('img');
      image.className = 'atlas-fish-image';
      const imagePath = isUnlocked ? fishData.texturePath : atlasWorld.lockedTexturePath;
      this.configureAtlasImage(
        image,
        imagePath,
        atlasWorld.lockedTexturePath,
        isUnlocked
          ? characterName(fishData)
          : t('a11y.lockedCharacterImage', { level: fishData.level }),
      );
      imageWrap.appendChild(image);

      const name = document.createElement('strong');
      name.textContent = isUnlocked ? characterName(fishData) : t('atlas.lockedName');
      const description = document.createElement('span');
      description.className = 'atlas-fish-description';
      description.textContent = isUnlocked ? characterDescription(fishData) : ATLAS_CONFIG.lockedDescription;

      const level = document.createElement('span');
      level.className = 'atlas-fish-level';
      level.textContent = t('atlas.level', { level: fishData.level });
      if (isUnlocked && fishData.glowColor) {
        imageWrap.classList.add('has-character-glow');
        imageWrap.style.setProperty('--character-glow-color', fishData.glowColor);
      }

      card.append(imageWrap, level, name, description);
      if (isUnlocked) card.addEventListener('click', () => this.openFishDetail(levelIndex));
      ui.atlasGrid.appendChild(card);
    });
  }

  openAtlas() {
    if (!ui.atlasModal.hidden) return;
    this.playSound('button');
    this.cancelCurrentFruitDrag();
    this.atlasWorldId = activeWorldId;
    this.atlasWasRunning = !this.isPaused && !this.gameEnded && !this.isMainMenuOpen;
    if (this.atlasWasRunning) {
      this.matter.world.pause();
      this.time.paused = true;
      this.setWorldCharacterAnimationsPaused(true);
      this.setSharkPaused(true);
    }
    this.renderAtlas();
    ui.gameWrap.classList.add('is-atlas-open');
    ui.atlasModal.hidden = false;
  }

  closeAtlas() {
    if (ui.atlasModal.hidden) return;
    this.playSound('button');
    ui.fishDetailModal.hidden = true;
    ui.atlasModal.hidden = true;
    ui.gameWrap.classList.remove('is-atlas-open');
    if (this.atlasWasRunning && !this.isPaused && !this.gameEnded) {
      this.time.paused = false;
      this.matter.world.resume();
      this.setWorldCharacterAnimationsPaused(false);
      this.setSharkPaused(false);
      if (this.currentFruit?.isHeld) this.positionCurrentFruit(this.lastDragX);
    }
    this.atlasWasRunning = false;
  }

  openFishDetail(levelIndex) {
    const atlasWorld = WORLDS[this.atlasWorldId] || this.world;
    const atlasCollection = readCollectionLevels(atlasWorld);
    const fishData = atlasWorld.characters[levelIndex];
    if (!fishData || !atlasCollection.has(levelIndex)) return;
    this.playSound('button');
    this.configureAtlasImage(
      ui.fishDetailImage,
      fishData.texturePath,
      atlasWorld.lockedTexturePath,
      characterName(fishData),
    );
    ui.fishDetailLevel.textContent = t('atlas.level', { level: fishData.level });
    ui.fishDetailName.textContent = characterName(fishData);
    ui.fishDetailCharacter.textContent = characterTrait(fishData);
    ui.fishDetailDescription.textContent = characterDescription(fishData);
    ui.fishDetailModal.dataset.level = String(levelIndex);
    ui.fishDetailModal.dataset.world = atlasWorld.id;
    ui.fishDetailImage.classList.toggle('has-character-glow', Boolean(fishData.glowColor));
    if (fishData.glowColor) ui.fishDetailImage.style.setProperty('--character-glow-color', fishData.glowColor);
    ui.fishDetailModal.hidden = false;
  }

  closeFishDetail() {
    if (ui.fishDetailModal.hidden) return;
    this.playSound('button');
    ui.fishDetailModal.hidden = true;
  }

  async showFishUnlock(levelIndex) {
    const fishData = FISH_DATA[levelIndex];
    if (!fishData) return;

    window.clearTimeout(this.unlockDismissTimer);
    window.clearTimeout(this.unlockAutoCloseTimer);
    const revealRevision = ++this.unlockRevealRevision;
    ui.fishUnlockModal.hidden = true;
    await prepareUnlockImage(FRUITS[levelIndex].texturePath);
    if (revealRevision !== this.unlockRevealRevision) return;
    this.configureAtlasImage(
      ui.fishUnlockImage,
      FRUITS[levelIndex].texturePath,
      this.world.lockedTexturePath,
      characterName(fishData),
    );
    ui.fishUnlockName.textContent = characterName(fishData);
    ui.fishUnlockDescription.textContent = characterDescription(fishData);
    ui.fishUnlockModal.dataset.level = String(levelIndex);
    ui.fishUnlockModal.classList.remove('can-dismiss');
    // Изображение и текст готовятся в скрытой переиспользуемой карточке.
    // Отделяем её композицию от merge/VFX; layout не измеряем после CSS-записей.
    if (ui.fishUnlockImage.decode) await ui.fishUnlockImage.decode().catch(() => {});
    await new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
    if (revealRevision !== this.unlockRevealRevision || this.gameEnded || this.nativeInBackground) return;
    ui.fishUnlockModal.hidden = false;
    this.unlockCanDismissAt = performance.now() + ATLAS_CONFIG.unlockDismissDelay;
    this.unlockDismissTimer = window.setTimeout(() => {
      ui.fishUnlockModal.classList.add('can-dismiss');
    }, ATLAS_CONFIG.unlockDismissDelay);
    this.unlockAutoCloseTimer = window.setTimeout(
      () => this.closeFishUnlock(true),
      ATLAS_CONFIG.unlockAutoCloseDelay,
    );
  }

  closeFishUnlock(force = false) {
    if (force) this.unlockRevealRevision += 1;
    if (ui.fishUnlockModal.hidden) return;
    if (!force && performance.now() < this.unlockCanDismissAt) return;
    window.clearTimeout(this.unlockDismissTimer);
    window.clearTimeout(this.unlockAutoCloseTimer);
    ui.fishUnlockModal.hidden = true;
    ui.fishUnlockModal.classList.remove('can-dismiss');
    const nextCharacter = FRUITS[Number(ui.fishUnlockModal.dataset.level) + 1];
    if (nextCharacter) void prepareUnlockImage(nextCharacter.texturePath);
  }

  // ======================== Служебные QA-сценарии ========================

  setupMaxMergeQa() {
    this.unlockAllLevelsForQa();
    this.time.delayedCall(QA_CONFIG.setupDelay, () => {
      const left = this.createFruit(GAME_WIDTH / 2 - QA_CONFIG.mergeOffsetX, QA_CONFIG.mergeY, maxLevelIndex());
      const right = this.createFruit(GAME_WIDTH / 2 + QA_CONFIG.mergeOffsetX, QA_CONFIG.mergeY, maxLevelIndex());
      left.physics.setVelocity(QA_CONFIG.mergeVelocityX, QA_CONFIG.mergeVelocityY);
      right.physics.setVelocity(-QA_CONFIG.mergeVelocityX, QA_CONFIG.mergeVelocityY);
    });
  }

  setupLevelOneMergeQa() {
    this.time.delayedCall(QA_CONFIG.setupDelay, () => {
      const left = this.createFruit(
        GAME_WIDTH / 2 - QA_CONFIG.levelOneMergeOffsetX,
        QA_CONFIG.mergeY,
        FISH_ANIMATION.levelIndex,
      );
      const right = this.createFruit(
        GAME_WIDTH / 2 + QA_CONFIG.levelOneMergeOffsetX,
        QA_CONFIG.mergeY,
        FISH_ANIMATION.levelIndex,
      );
      left.physics.setVelocity(QA_CONFIG.mergeVelocityX, QA_CONFIG.mergeVelocityY);
      right.physics.setVelocity(-QA_CONFIG.mergeVelocityX, QA_CONFIG.mergeVelocityY);
    });
  }

  setupCreateMaxLevelQa() {
    const sourceLevel = maxLevelIndex() - 1;
    this.unlockedLevels = new Set(FRUITS.slice(0, maxLevelIndex()).map((_, index) => index));
    this.renderProgression();
    this.time.delayedCall(QA_CONFIG.setupDelay, () => {
      const left = this.createFruit(GAME_WIDTH / 2 - QA_CONFIG.mergeOffsetX, QA_CONFIG.mergeY, sourceLevel);
      const right = this.createFruit(GAME_WIDTH / 2 + QA_CONFIG.mergeOffsetX, QA_CONFIG.mergeY, sourceLevel);
      left.physics.setVelocity(QA_CONFIG.mergeVelocityX, QA_CONFIG.mergeVelocityY);
      right.physics.setVelocity(-QA_CONFIG.mergeVelocityX, QA_CONFIG.mergeVelocityY);
    });
  }

  setupPhysicsPileQa() {
    this.unlockAllLevelsForQa();
    this.time.delayedCall(QA_CONFIG.setupDelay, () => {
      QA_CONFIG.pileLayout.forEach(([level, x, y]) => {
        const fruit = this.createFruit(x, y, level);
        fruit.bornAt = Number.POSITIVE_INFINITY;
      });
    });
  }

  setupGameOverQa() {
    this.time.delayedCall(QA_CONFIG.setupDelay, () => {
      const level = QA_CONFIG.gameOverLevelIndex;
      const radius = FRUITS[level].radius;
      const fruit = this.createFruit(
        GAME_WIDTH / 2,
        this.gameOverLineY - radius + QA_CONFIG.gameOverOverlap,
        level,
      );
      fruit.bornAt = this.time.now - GAMEPLAY.dangerStabilizationDelay;
      fruit.physics.setStatic(true);
    });
  }

  setupProgressionQa() {
    // Служебный сценарий последовательно показывает открытие всех уровней из конфигурации.
    FRUITS.slice(1).forEach((_, index) => {
      this.time.delayedCall(
        QA_CONFIG.progressionStartDelay + index * QA_CONFIG.progressionStepDelay,
        () => this.unlockLevel(index + 1),
      );
    });
  }

  // ======================== Фон и границы поля ========================

  createBackdrop() {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    const graphics = this.add.graphics().setDepth(BACKDROP_CONFIG.backgroundDepth);

    // Изображение поверхности — только декор; физический коллайдер остаётся отдельным и невидимым.
    const { backgrounds } = this.world;
    if (this.textures.exists(backgrounds.surfaceKey)) {
      this.textures.get(backgrounds.surfaceKey).setFilter(Phaser.Textures.FilterMode.LINEAR);
      const waterSurface = this.add
        .image(GAME_WIDTH / 2, SURFACE_Y, backgrounds.surfaceKey)
        .setOrigin(BACKDROP_CONFIG.surfaceOriginX, BACKDROP_CONFIG.surfaceOriginY)
        .setAlpha(BACKDROP_CONFIG.surfaceAlpha)
        .setDepth(BACKDROP_CONFIG.surfaceDepth);
      const widthScale = GAME_WIDTH / waterSurface.width;
      const topCoverageScale = (SURFACE_Y - BACKDROP_CONFIG.surfaceTopY)
        / (waterSurface.height * BACKDROP_CONFIG.surfaceOriginY);
      waterSurface.setScale(Math.max(widthScale, topCoverageScale));
    }

    graphics.lineStyle(BACKDROP_CONFIG.bubbleLineWidth, BACKDROP_CONFIG.bubbleColor, BACKDROP_CONFIG.bubbleAlpha);
    BACKDROP_CONFIG.decorativeBubbles.forEach(([bubbleX, bubbleY, bubbleRadius]) => {
      graphics.strokeCircle(bubbleX, bubbleY, bubbleRadius);
    });

    // Готовое изображение дна: масштабируется по ширине без искажения
    // и остаётся чисто декоративным (без физического тела Matter.js).
    if (this.textures.exists(backgrounds.seabedKey)) {
      this.seabed = this.add
        .image(GAME_WIDTH / 2, gameHeight, backgrounds.seabedKey)
        .setOrigin(BACKDROP_CONFIG.seabedOriginX, BACKDROP_CONFIG.seabedOriginY)
        .setDepth(BACKDROP_CONFIG.seabedDepth);
      this.seabed.setScale(GAME_WIDTH / this.seabed.width);
    }

    // Graphics создаётся один раз; дальше линия только перерисовывается и меняет видимость.
    this.guide = this.add.graphics().setDepth(GUIDE_CONFIG.depth).setVisible(false);
    this.gameOverLimitGraphics = this.add.graphics().setDepth(GAME_OVER_LIMIT_CONFIG.depth);
    this.recalculateGameOverLine();
    this.createGameOverDebugLine();
  }

  // ======================== Акула в глубине ========================

  startSharkCycle() {
    if (!SHARK_CONFIG.enabled) return;

    this.availableDepthVariants = this.world.backgroundEvents.filter((variant) => {
      const isLoaded = this.textures.exists(variant.textureKey);
      if (!isLoaded && !warnedMissingDepthAssets.has(variant.textureKey)) {
        warnedMissingDepthAssets.add(variant.textureKey);
        console.warn(
          `[Силуэты в глубине] Не удалось загрузить ${variant.texturePath}. Этот вариант отключён.`,
        );
      }
      return isLoaded;
    });
    if (!this.availableDepthVariants.length) return;

    this.availableDepthVariants.forEach((variant) => {
      this.textures.get(variant.textureKey).setFilter(Phaser.Textures.FilterMode.LINEAR);
    });
    const initialDelay = QA_DEPTH_EFFECT
      ? QA_CONFIG.setupDelay
      : SHARK_CONFIG.firstAppearanceDelay;
    this.scheduleNextSharkCheck(initialDelay);
  }

  scheduleNextSharkCheck(delay = SHARK_CONFIG.checkInterval) {
    this.sharkCheckTimer?.remove(false);
    this.sharkCheckTimer = null;
    if (this.gameEnded || this.shark) return;

    this.sharkCheckTimer = this.time.delayedCall(delay, () => {
      this.sharkCheckTimer = null;
      this.checkSharkAppearance();
    });
  }

  checkSharkAppearance() {
    if (this.gameEnded || this.shark) return;

    const reachedGuaranteedCheck = this.sharkFailedChecks >= SHARK_CONFIG.maxFailedChecks;
    const shouldAppear = QA_DEPTH_EFFECT
      || reachedGuaranteedCheck
      || Math.random() < SHARK_CONFIG.spawnChance;
    if (shouldAppear) {
      this.sharkFailedChecks = 0;
      this.createSharkPass();
      return;
    }

    this.sharkFailedChecks += 1;
    this.scheduleNextSharkCheck();
  }

  createSharkPass() {
    if (this.gameEnded || this.shark || !this.availableDepthVariants.length) return;

    const requestedVariant = this.availableDepthVariants.find(
      (variant) => variant.id === QA_DEPTH_VARIANT,
    );
    const alternatingVariants = this.availableDepthVariants.filter(
      (variant) => variant.id !== this.lastDepthVariantId,
    );
    const selectableVariants = alternatingVariants.length
      ? alternatingVariants
      : this.availableDepthVariants;
    const visualVariant = requestedVariant || selectableVariants[
      Phaser.Math.Between(0, selectableVariants.length - 1)
    ];
    this.lastDepthVariantId = visualVariant.id;

    const travelsRightToLeft = QA_SHARK_DIRECTION === 'right'
      || (QA_SHARK_DIRECTION !== 'left' && Phaser.Math.Between(0, 1) === 1);
    const yPercent = Phaser.Math.FloatBetween(
      SHARK_CONFIG.minYPercent,
      SHARK_CONFIG.maxYPercent,
    );
    const targetAlpha = Phaser.Math.FloatBetween(
      SHARK_CONFIG.minAlpha,
      SHARK_CONFIG.maxAlpha,
    );
    const scaleMultiplier = Phaser.Math.FloatBetween(
      SHARK_CONFIG.minScale,
      SHARK_CONFIG.maxScale,
    );
    const travelDuration = Phaser.Math.Between(
      SHARK_CONFIG.minTravelTime,
      SHARK_CONFIG.maxTravelTime,
    );

    const shark = this.add
      .image(0, gameHeight * yPercent, visualVariant.textureKey)
      .setOrigin(0.5)
      .setDepth(SHARK_CONFIG.depth)
      .setAlpha(0)
      .setFlipX(travelsRightToLeft);
    const baseScale = (GAME_WIDTH * SHARK_CONFIG.baseWidthRatio) / shark.width;
    shark.setScale(baseScale * scaleMultiplier);
    shark.setData('yPercent', yPercent);

    const halfWidth = shark.displayWidth / 2;
    const visibleEdge = shark.displayWidth * SHARK_CONFIG.edgeRevealRatio;
    const startX = travelsRightToLeft
      ? GAME_WIDTH + halfWidth - visibleEdge
      : -halfWidth + visibleEdge;
    const endX = travelsRightToLeft
      ? -halfWidth + visibleEdge
      : GAME_WIDTH + halfWidth - visibleEdge;
    shark.setX(startX);
    this.shark = shark;

    if (QA_DEPTH_EFFECT) {
      ui.gameWrap.dataset.qaDepthVariant = visualVariant.id;
      ui.gameWrap.dataset.qaSharkDirection = travelsRightToLeft ? 'right-to-left' : 'left-to-right';
      ui.gameWrap.dataset.qaSharkState = 'fade-in';
    }

    this.sharkTween = this.tweens.add({
      targets: shark,
      alpha: targetAlpha,
      duration: SHARK_CONFIG.fadeDuration,
      ease: 'Sine.easeInOut',
      onComplete: () => this.startSharkTravel(shark, endX, targetAlpha, travelDuration),
    });
  }

  startSharkTravel(shark, endX, targetAlpha, travelDuration) {
    if (this.shark !== shark || !shark.active) return;
    if (QA_DEPTH_EFFECT) ui.gameWrap.dataset.qaSharkState = 'travel';

    this.sharkTween = this.tweens.add({
      targets: shark,
      x: endX,
      alpha: targetAlpha,
      duration: travelDuration,
      ease: 'Linear',
      onUpdate: () => {
        if (QA_DEPTH_EFFECT) ui.gameWrap.dataset.qaSharkX = shark.x.toFixed(2);
      },
      onComplete: () => this.fadeOutShark(shark),
    });
  }

  fadeOutShark(shark) {
    if (this.shark !== shark || !shark.active) return;
    if (QA_DEPTH_EFFECT) ui.gameWrap.dataset.qaSharkState = 'fade-out';

    this.sharkTween = this.tweens.add({
      targets: shark,
      alpha: 0,
      duration: SHARK_CONFIG.fadeDuration,
      ease: 'Sine.easeInOut',
      onComplete: () => this.finishSharkPass(shark),
    });
  }

  finishSharkPass(shark) {
    if (this.shark !== shark) return;
    shark.destroy();
    this.shark = null;
    this.sharkTween = null;
    if (QA_DEPTH_EFFECT) ui.gameWrap.dataset.qaSharkState = 'finished';
    if (this.gameEnded) return;

    this.scheduleNextSharkCheck(Phaser.Math.Between(
      SHARK_CONFIG.postPassMinInterval,
      SHARK_CONFIG.postPassMaxInterval,
    ));
  }

  setSharkPaused(value) {
    if (!this.sharkTween) return;
    if (value) this.sharkTween.pause();
    else this.sharkTween.resume();
  }

  stopSharkEffect() {
    this.sharkCheckTimer?.remove(false);
    this.sharkCheckTimer = null;
    this.sharkTween?.stop();
    this.sharkTween = null;
    this.shark?.destroy();
    this.shark = null;
  }

  recalculateGameOverLine() {
    this.gameOverLineY = spawnY() - SCENE_CONFIG.gameOverOffsetAboveSpawn;
    this.drawGameOverLimitLine();
    this.drawGameOverDebugLine();
  }

  drawGameOverLimitLine() {
    if (!this.gameOverLimitGraphics) return;

    const lineStartX = GAME_OVER_LIMIT_CONFIG.sideInset;
    const lineEndX = GAME_WIDTH - GAME_OVER_LIMIT_CONFIG.sideInset;
    const dashStep = GAME_OVER_LIMIT_CONFIG.dashLength + GAME_OVER_LIMIT_CONFIG.gapLength;

    this.gameOverLimitGraphics.clear();
    this.gameOverLimitGraphics.lineStyle(
      GAME_OVER_LIMIT_CONFIG.width,
      GAME_OVER_LIMIT_CONFIG.color,
      GAME_OVER_LIMIT_CONFIG.alpha,
    );

    for (let dashStartX = lineStartX; dashStartX < lineEndX; dashStartX += dashStep) {
      this.gameOverLimitGraphics.lineBetween(
        dashStartX,
        this.gameOverLineY,
        Math.min(dashStartX + GAME_OVER_LIMIT_CONFIG.dashLength, lineEndX),
        this.gameOverLineY,
      );
    }
  }

  createGameOverDebugLine() {
    if (!DEBUG_GAME_OVER_LINE) return;
    this.gameOverDebugGraphics = this.add.graphics().setDepth(DEBUG_VIEW_CONFIG.depth);
    this.gameOverDebugLabel = this.add.text(
      DEBUG_VIEW_CONFIG.labelX,
      this.gameOverLineY - DEBUG_VIEW_CONFIG.labelCreateOffsetY,
      t('debug.gameOverLimit'),
      {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${DEBUG_VIEW_CONFIG.fontSize}px`,
      fontStyle: '900',
      color: DEBUG_VIEW_CONFIG.labelColor,
      backgroundColor: DEBUG_VIEW_CONFIG.labelBackground,
      padding: { x: DEBUG_VIEW_CONFIG.labelPaddingX, y: DEBUG_VIEW_CONFIG.labelPaddingY },
    }).setDepth(DEBUG_VIEW_CONFIG.labelDepth);
    this.drawGameOverDebugLine();
  }

  drawGameOverDebugLine() {
    if (!DEBUG_GAME_OVER_LINE || !this.gameOverDebugGraphics || !this.gameOverDebugLabel) return;
    this.gameOverDebugGraphics.clear();
    this.gameOverDebugGraphics.lineStyle(
      DEBUG_VIEW_CONFIG.lineWidth,
      DEBUG_VIEW_CONFIG.lineColor,
      DEBUG_VIEW_CONFIG.lineAlpha,
    );
    this.gameOverDebugGraphics.lineBetween(0, this.gameOverLineY, GAME_WIDTH, this.gameOverLineY);
    this.gameOverDebugLabel.setPosition(
      DEBUG_VIEW_CONFIG.labelX,
      this.gameOverLineY - DEBUG_VIEW_CONFIG.labelDrawOffsetY,
    );
  }

  createInvisibleBounds() {
    this.boundBodies.forEach((body) => this.matter.world.remove(body));
    const sideOptions = {
      isStatic: true,
      friction: PHYSICS_CONFIG.wallFriction,
      frictionStatic: PHYSICS_CONFIG.wallStaticFriction,
      restitution: PHYSICS_CONFIG.restitution,
      label: 'wall',
    };
    const surfaceOptions = {
      isStatic: true,
      friction: PHYSICS_CONFIG.wallFriction,
      frictionStatic: PHYSICS_CONFIG.surfaceStaticFriction,
      restitution: 0,
      label: 'surface',
    };
    this.boundBodies = [
      this.matter.add.rectangle(WALL_SIZE / 2, gameHeight / 2, WALL_SIZE, gameHeight, sideOptions),
      this.matter.add.rectangle(GAME_WIDTH - WALL_SIZE / 2, gameHeight / 2, WALL_SIZE, gameHeight, sideOptions),
      this.matter.add.rectangle(GAME_WIDTH / 2, SURFACE_Y - WALL_SIZE / 2, GAME_WIDTH, WALL_SIZE, surfaceOptions),
      this.matter.add.rectangle(GAME_WIDTH / 2, gameHeight + WALL_SIZE / 2, GAME_WIDTH, WALL_SIZE, sideOptions),
    ];
  }

  handleGameResize() {
    if (this.seabed?.active) this.seabed.setPosition(GAME_WIDTH / 2, gameHeight);
    if (this.shark?.active) {
      this.shark.setY(gameHeight * this.shark.getData('yPercent'));
    }
    this.createInvisibleBounds();

    for (const fruit of this.fruits.values()) {
      if (!fruit.physics?.body) continue;
      const radius = FRUITS[fruit.level].radius;
      const maximumY = gameHeight - WALL_SIZE - radius;
      if (fruit.physics.y > maximumY) fruit.physics.setPosition(fruit.physics.x, maximumY);
    }

    if (this.currentFruit?.isHeld) {
      const radius = FRUITS[this.currentFruit.level].radius;
      const x = Phaser.Math.Clamp(this.currentFruit.visual.x, WALL_SIZE + radius, GAME_WIDTH - WALL_SIZE - radius);
      this.positionCurrentFruit(x);
    }

    this.recalculateGameOverLine();
  }

  // ======================== Создание рыб ========================

  randomStartingLevel() {
    const availableLevels = Math.min(
      STARTING_LEVELS + this.unlockedLevels.size - 1,
      SCENE_CONFIG.maximumStartingLevelCount,
    );
    return Phaser.Math.Between(0, availableLevels - 1);
  }

  spawnFruit() {
    if (this.gameEnded || this.isPaused) return;
    const level = this.nextLevel;
    this.nextLevel = this.randomStartingLevel();
    this.updateNextPreview();
    this.currentFruit = this.createFruit(GAME_WIDTH / 2, spawnY(), level, true);
    this.canDrop = true;
    this.controlState = CONTROL_STATES.WAITING;
    this.activePointerId = null;
    this.activeNativePointerId = null;
    this.dragOffsetX = 0;
    this.lastDragX = GAME_WIDTH / 2;
    this.positionCurrentFruit(this.lastDragX);
  }

  hasLevelOneAnimationTextures() {
    const requiredTextures = [
      FISH_ANIMATION.bodyTextureKey,
      FISH_ANIMATION.eyesClosedTextureKey,
    ];
    const hasEveryTexture = requiredTextures.every((textureKey) => this.textures.exists(textureKey));
    if (!hasEveryTexture && !warnedMissingLevelOneAnimation) {
      warnedMissingLevelOneAnimation = true;
      console.warn(
        '[Анимация level1] Не все слои body.png и eyes_closed.png загружены. Используется обычный assets/fish/level1.png.',
      );
    }
    return hasEveryTexture;
  }

  createLevelOneAnimatedVisual(x, y, config) {
    const body = this.add.image(0, 0, FISH_ANIMATION.bodyTextureKey)
      .setOrigin(config.originX, config.originY);
    const eyesClosed = this.add.image(0, 0, FISH_ANIMATION.eyesClosedTextureKey)
      .setOrigin(config.originX, config.originY)
      .setVisible(false);

    const idleVisual = this.add.container(0, 0, [body, eyesClosed]);
    const visual = this.add.container(x, y, [idleVisual])
      .setDepth(FISH_VISUAL_CONFIG.imageDepth);
    const targetImageWidth = (config.radius * 2) / config.bodyRatio;
    const baseVisualScale = targetImageWidth / body.width;
    visual.setScale(baseVisualScale);

    return { visual, idleVisual, body, eyesClosed, baseVisualScale };
  }

  scheduleFruitAnimationCall(fruit, delay, callback) {
    if (fruit.removed) return null;
    let timer = null;
    timer = this.time.delayedCall(delay, () => {
      fruit.animationTimers.delete(timer);
      if (!fruit.removed) callback();
    });
    fruit.animationTimers.add(timer);
    return timer;
  }

  scheduleNextBlink(fruit) {
    if (!fruit.eyesClosed || fruit.removed) return;
    const delay = Phaser.Math.Between(
      FISH_ANIMATION.blinkMinDelay,
      FISH_ANIMATION.blinkMaxDelay,
    );
    this.scheduleFruitAnimationCall(fruit, delay, () => this.runBlink(fruit));
  }

  runBlink(fruit) {
    if (!fruit.eyesClosed || fruit.removed) return;
    fruit.eyesClosed.setVisible(true);
    const useDoubleBlink = Math.random() < FISH_ANIMATION.doubleBlinkChance;

    this.scheduleFruitAnimationCall(fruit, FISH_ANIMATION.blinkDuration, () => {
      fruit.eyesClosed.setVisible(false);
      if (!useDoubleBlink) {
        this.scheduleNextBlink(fruit);
        return;
      }

      const openDelay = Phaser.Math.Between(
        FISH_ANIMATION.doubleBlinkOpenMinDelay,
        FISH_ANIMATION.doubleBlinkOpenMaxDelay,
      );
      this.scheduleFruitAnimationCall(fruit, openDelay, () => {
        fruit.eyesClosed.setVisible(true);
        this.scheduleFruitAnimationCall(fruit, FISH_ANIMATION.doubleBlinkDuration, () => {
          fruit.eyesClosed.setVisible(false);
          this.scheduleNextBlink(fruit);
        });
      });
    });
  }

  startBlinkAnimation(fruit) {
    if (!fruit.eyesClosed || fruit.animationTimers.size) return;
    this.scheduleNextBlink(fruit);
  }

  stopBlinkAnimation(fruit) {
    if (fruit.animationTimers?.size) this.stoppedBlinkAnimationCount += 1;
    fruit.animationTimers?.forEach((timer) => timer.remove(false));
    fruit.animationTimers?.clear();
    fruit.eyesClosed?.setVisible(false);
  }

  // Внутренний контейнер дышит отдельно от root visual, который используется merge-bounce.
  startCharacterIdleAnimation(fruit) {
    if (!fruit.idleVisual || fruit.idleTween || fruit.removed) return;
    const idleConfig = CHARACTER_IDLE_CONFIG[this.world.characterType];
    if (!idleConfig) return;

    if (this.world.characterType === 'jellyfish') {
      const pulseScaleX = Phaser.Math.FloatBetween(
        idleConfig.pulseScaleXMin,
        idleConfig.pulseScaleXMax,
      );
      const pulseScaleY = Phaser.Math.FloatBetween(
        idleConfig.pulseScaleYMin,
        idleConfig.pulseScaleYMax,
      );
      fruit.idleProfile = {
        pulseScaleX,
        pulseScaleY,
        glowScale: Phaser.Math.FloatBetween(idleConfig.glowScaleMin, idleConfig.glowScaleMax),
        glowAlphaMultiplier: Phaser.Math.FloatBetween(
          idleConfig.glowAlphaMultiplierMin,
          idleConfig.glowAlphaMultiplierMax,
        ),
      };
      fruit.idleState = { progress: 0 };
      fruit.idleTween = this.tweens.add({
        targets: fruit.idleState,
        progress: 1,
        duration: Phaser.Math.Between(
          idleConfig.pulseDurationMin,
          idleConfig.pulseDurationMax,
        ),
        delay: Phaser.Math.Between(0, idleConfig.maxInitialDelay),
        repeatDelay: Phaser.Math.Between(idleConfig.pulseRestMin, idleConfig.pulseRestMax),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        onUpdate: () => this.applyCharacterIdleState(fruit),
      });
      this.startCharacterFloatAnimation(fruit, idleConfig, false);
      return;
    }

    fruit.idleTween = this.tweens.add({
      targets: fruit.idleVisual,
      scaleX: Phaser.Math.FloatBetween(idleConfig.breathScaleXMin, idleConfig.breathScaleXMax),
      scaleY: Phaser.Math.FloatBetween(idleConfig.breathScaleYMin, idleConfig.breathScaleYMax),
      duration: Phaser.Math.Between(idleConfig.breathDurationMin, idleConfig.breathDurationMax),
      delay: Phaser.Math.Between(0, idleConfig.maxInitialDelay),
      repeatDelay: Phaser.Math.Between(idleConfig.breathRestMin, idleConfig.breathRestMax),
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    this.startCharacterFloatAnimation(fruit, idleConfig, true);
  }

  startCharacterFloatAnimation(fruit, idleConfig, includesRotation) {
    fruit.floatState = { phase: 0 };
    fruit.floatProfile = {
      upOffset: idleConfig.floatUpOffset,
      downOffset: idleConfig.floatDownOffset,
      rotation: includesRotation
        ? Phaser.Math.FloatBetween(idleConfig.floatRotationMin, idleConfig.floatRotationMax)
        : 0,
    };
    fruit.floatTween = this.tweens.add({
      targets: fruit.floatState,
      phase: 1,
      duration: Phaser.Math.Between(
        idleConfig.floatCycleDurationMin,
        idleConfig.floatCycleDurationMax,
      ),
      delay: Phaser.Math.Between(0, idleConfig.maxInitialDelay),
      ease: 'Sine.easeInOut',
      repeat: -1,
      onUpdate: () => this.applyCharacterFloatState(fruit),
    });
  }

  applyCharacterFloatState(fruit) {
    if (fruit.removed || !fruit.idleVisual || !fruit.floatState || !fruit.floatProfile) return;
    const wave = Math.sin(fruit.floatState.phase * NUMBER_FORMAT_CONFIG.fullCircle);
    const y = wave >= 0
      ? fruit.floatProfile.upOffset * wave
      : fruit.floatProfile.downOffset * -wave;
    fruit.idleVisual.setY(y).setRotation(
      Phaser.Math.DegToRad(fruit.floatProfile.rotation) * wave,
    );
  }

  applyCharacterIdleState(fruit) {
    if (fruit.removed || !fruit.idleVisual || !fruit.idleState || !fruit.idleProfile) return;
    const progress = fruit.idleState.progress;
    fruit.idleVisual.setScale(
      Phaser.Math.Linear(1, fruit.idleProfile.pulseScaleX, progress),
      Phaser.Math.Linear(1, fruit.idleProfile.pulseScaleY, progress),
    );
    if (!fruit.characterGlow) return;
    const glowScale = Phaser.Math.Linear(1, fruit.idleProfile.glowScale, progress);
    fruit.characterGlow.setScale(
      fruit.glowBaseScaleX * glowScale,
      fruit.glowBaseScaleY * glowScale,
    ).setAlpha(Phaser.Math.Linear(
      fruit.glowBaseAlpha,
      Math.min(1, fruit.glowBaseAlpha * fruit.idleProfile.glowAlphaMultiplier),
      progress,
    ));
  }

  resetCharacterIdleVisual(fruit) {
    if (fruit.idleState) fruit.idleState.progress = 0;
    if (fruit.floatState) fruit.floatState.phase = 0;
    fruit.idleVisual?.setPosition(0, 0).setScale(1).setRotation(0);
    if (fruit.characterGlow && Number.isFinite(fruit.glowBaseScaleX)) {
      fruit.characterGlow
        .setScale(fruit.glowBaseScaleX, fruit.glowBaseScaleY)
        .setAlpha(fruit.glowBaseAlpha);
    }
  }

  stopCharacterIdleAnimation(fruit) {
    if (fruit.idleTween || fruit.floatTween) this.stoppedIdleAnimationCount += 1;
    fruit.idleTween?.stop();
    fruit.idleTween?.remove();
    fruit.floatTween?.stop();
    fruit.floatTween?.remove();
    fruit.idleTween = null;
    fruit.floatTween = null;
    this.resetCharacterIdleVisual(fruit);
    fruit.idleState = null;
    fruit.idleProfile = null;
    fruit.floatState = null;
    fruit.floatProfile = null;
  }

  createFruit(x, y, level, isHeld = false) {
    const config = FRUITS[level];

    // visual и label не участвуют в физике: позже visual можно заменить изображением рыбки.
    const usesAnimatedLevelOne = config.animation === 'blink-level-1'
      && level === FISH_ANIMATION.levelIndex
      && this.hasLevelOneAnimationTextures();
    const hasTexture = this.textures.exists(config.textureKey);
    let visual;
    let shine = null;
    let label = null;
    let baseVisualScale = 1;
    let idleVisual = null;
    let body = null;
    let eyesClosed = null;

    if (usesAnimatedLevelOne) {
      const animatedVisual = this.createLevelOneAnimatedVisual(x, y, config);
      ({ visual, idleVisual, body, eyesClosed, baseVisualScale } = animatedVisual);
    } else if (hasTexture) {
      const image = this.add.image(0, 0, config.textureKey)
        .setOrigin(config.originX, config.originY);
      idleVisual = this.add.container(0, 0, [image]);
      visual = this.add.container(x, y, [idleVisual])
        .setDepth(FISH_VISUAL_CONFIG.imageDepth);
      // Основное тело занимает bodyRatio ширины PNG; хвост остаётся вне коллайдера.
      const targetImageWidth = (config.radius * 2) / config.bodyRatio;
      baseVisualScale = targetImageWidth / image.width;
      visual.setScale(baseVisualScale);
    } else {
      visual = this.add.circle(x, y, config.radius, config.color)
        .setStrokeStyle(
          FISH_VISUAL_CONFIG.fallbackStrokeWidth,
          0xffffff,
          FISH_VISUAL_CONFIG.fallbackStrokeAlpha,
        )
        .setDepth(FISH_VISUAL_CONFIG.fallbackCircleDepth);
      shine = this.add.ellipse(
        x - config.radius * FISH_VISUAL_CONFIG.shineOffsetX,
        y - config.radius * FISH_VISUAL_CONFIG.shineOffsetY,
        config.radius * FISH_VISUAL_CONFIG.shineWidthRatio,
        config.radius * FISH_VISUAL_CONFIG.shineHeightRatio,
        0xffffff,
        FISH_VISUAL_CONFIG.shineAlpha,
      ).setDepth(FISH_VISUAL_CONFIG.imageDepth);
      label = this.add.text(x, y, String(config.level), {
        fontFamily: 'Nunito, sans-serif',
        fontSize: `${Math.max(
          FISH_VISUAL_CONFIG.labelMinimumSize,
          config.radius * FISH_VISUAL_CONFIG.labelSizeRatio,
        )}px`,
        fontStyle: '900',
        color: '#ffffff',
        shadow: {
          offsetX: 0,
          offsetY: FISH_VISUAL_CONFIG.labelShadowOffsetY,
          color: FISH_VISUAL_CONFIG.labelShadowColor,
          blur: FISH_VISUAL_CONFIG.labelShadowBlur,
          fill: true,
        },
      }).setOrigin(NUMBER_FORMAT_CONFIG.normalizedCenter).setDepth(FISH_VISUAL_CONFIG.labelDepth);
    }

    const fruit = {
      visual,
      shine,
      label,
      baseVisualScale,
      idleVisual,
      idleTween: null,
      idleState: null,
      idleProfile: null,
      floatTween: null,
      floatState: null,
      floatProfile: null,
      usesTexture: usesAnimatedLevelOne || hasTexture,
      body,
      eyesClosed,
      animationTimers: new Set(),
      characterGlow: null,
      ambientGlow: null,
      glowTween: null,
      glowBaseScaleX: 1,
      glowBaseScaleY: 1,
      glowBaseAlpha: 0,
      physics: null,
      level,
      isHeld,
      merging: false,
      removed: false,
      bornAt: this.time.now,
      wobbleSeed: Math.random() * NUMBER_FORMAT_CONFIG.fullCircle,
      lastBubbleAt: this.time.now + Phaser.Math.Between(0, FISH_VISUAL_CONFIG.initialBubbleDelayMax),
    };
    this.createWorldCharacterGlow(fruit, config);
    this.startCharacterIdleAnimation(fruit);
    if (usesAnimatedLevelOne) this.startBlinkAnimation(fruit);
    if (!isHeld) this.activateFruitPhysics(fruit);
    return fruit;
  }

  createWorldCharacterGlow(fruit, config) {
    const glowConfig = this.world.glow;
    if (DEBUG_DISABLE_WORLD_GLOW || !glowConfig || !fruit.usesTexture || !config.glowColorNumber) return;

    if (!this.textures.exists(GLOW_SPHERE_TEXTURE_KEY)) return;
    const sphereDiameter = config.radius * 2 * glowConfig.sphereScale;
    fruit.characterGlow = this.add.image(
      fruit.visual.x,
      fruit.visual.y,
      GLOW_SPHERE_TEXTURE_KEY,
    ).setDepth(FISH_VISUAL_CONFIG.imageDepth - 0.1)
      .setTint(config.glowColorNumber)
      .setAlpha(glowConfig.sphereAlpha)
      .setDisplaySize(sphereDiameter, sphereDiameter);
    fruit.glowBaseScaleX = fruit.characterGlow.scaleX;
    fruit.glowBaseScaleY = fruit.characterGlow.scaleY;
    fruit.glowBaseAlpha = glowConfig.sphereAlpha;
  }

  setWorldCharacterAnimationsPaused(value) {
    const characters = new Set(this.fruits.values());
    if (this.currentFruit) characters.add(this.currentFruit);
    characters.forEach((fruit) => {
      [fruit.idleTween, fruit.floatTween, fruit.glowTween].filter(Boolean).forEach((tween) => {
        if (value) tween.pause();
        else tween.resume();
      });
      fruit.animationTimers?.forEach((timer) => {
        timer.paused = value;
      });
    });
    if (QA_FISH_ANIMATION) {
      ui.gameWrap.dataset.qaCharacterAnimationsPaused = String(value);
    }
  }

  activateFruitPhysics(fruit) {
    const config = FRUITS[fruit.level];
    const collider = this.add.circle(
      fruit.visual.x,
      fruit.visual.y,
      config.radius,
      0xffffff,
      0,
    ).setDepth(FISH_VISUAL_CONFIG.colliderDepth);

    this.matter.add.gameObject(collider, {
      shape: { type: 'circle', radius: config.radius },
      restitution: PHYSICS_CONFIG.restitution,
      friction: PHYSICS_CONFIG.wallFriction,
      frictionStatic: PHYSICS_CONFIG.wallStaticFriction,
      frictionAir: GAMEPLAY.waterDrag,
      density: PHYSICS_CONFIG.fishDensity,
      label: `fish-${fruit.level}`,
    });

    fruit.physics = collider;
    fruit.isHeld = false;
    fruit.bornAt = this.time.now;
    collider.body.fruitData = fruit;
    this.fruits.set(collider.body.id, fruit);
  }

  syncFruitVisual(fruit, time) {
    const motionFactor = Phaser.Math.Clamp(fruit.physics.body.speed / FISH_VISUAL_CONFIG.wobbleSpeedDivisor, 0, 1);
    const contactFactor = this.touchingSurface.has(fruit.physics.body.id) ? 0 : 1;
    const wobble = Math.sin(time * FISH_VISUAL_CONFIG.wobbleTimeFactor + fruit.wobbleSeed)
      * FISH_VISUAL_CONFIG.wobbleAmplitude
      * motionFactor
      * contactFactor;
    const x = fruit.physics.x;
    const y = fruit.physics.y;
    const rotation = fruit.physics.rotation + wobble;
    const radius = FRUITS[fruit.level].radius;

    fruit.visual.setPosition(x, y).setRotation(rotation);
    fruit.characterGlow?.setPosition(x, y).setRotation(rotation);
    fruit.ambientGlow?.setPosition(x, y);
    fruit.label?.setPosition(x, y).setRotation(rotation * FISH_VISUAL_CONFIG.labelRotationFactor);
    fruit.shine?.setPosition(
      x - radius * FISH_VISUAL_CONFIG.shineOffsetX,
      y - radius * FISH_VISUAL_CONFIG.shineOffsetY,
    ).setRotation(rotation);
  }

  // ======================== Управление текущей рыбой ========================

  isPointerOnReleasedFruit(pointer) {
    if (!Number.isFinite(pointer.worldX) || !Number.isFinite(pointer.worldY)) return false;
    for (const fruit of this.fruits.values()) {
      if (!fruit.physics?.body || fruit.removed) continue;
      const radius = FRUITS[fruit.level].radius;
      const dx = pointer.worldX - fruit.physics.x;
      const dy = pointer.worldY - fruit.physics.y;
      if (Math.hypot(dx, dy) <= radius) return true;
    }
    return false;
  }

  beginCurrentFruitDrag(pointer) {
    if (!this.currentFruit || !this.canDrop || this.gameEnded || this.isPaused) return;
    if (this.controlState !== CONTROL_STATES.WAITING || this.isPointerOnReleasedFruit(pointer)) return;

    pointer.event?.preventDefault?.();
    this.controlState = CONTROL_STATES.DRAGGING;
    this.activePointerId = pointer.id;
    this.activeNativePointerId = pointer.event?.pointerId ?? null;
    this.dragOffsetX = this.currentFruit.visual.x - pointer.worldX;
    this.lastDragX = this.currentFruit.visual.x;

    const target = pointer.event?.currentTarget || pointer.event?.target;
    if (target?.setPointerCapture && this.activeNativePointerId !== null) {
      try {
        target.setPointerCapture(this.activeNativePointerId);
      } catch {
        // Некоторые мобильные браузеры сами удерживают pointer capture для canvas.
      }
    }
  }

  positionCurrentFruit(rawX) {
    if (!this.currentFruit) return;
    const radius = FRUITS[this.currentFruit.level].radius;
    const x = Phaser.Math.Clamp(rawX, WALL_SIZE + radius, GAME_WIDTH - WALL_SIZE - radius);
    this.lastDragX = x;
    this.currentFruit.visual.setPosition(x, spawnY());
    this.currentFruit.characterGlow?.setPosition(x, spawnY());
    this.currentFruit.ambientGlow?.setPosition(x, spawnY());
    this.currentFruit.label?.setPosition(x, spawnY());
    this.currentFruit.shine?.setPosition(
      x - radius * FISH_VISUAL_CONFIG.shineOffsetX,
      spawnY() - radius * FISH_VISUAL_CONFIG.shineOffsetY,
    );
    this.drawGuide(x);
  }

  dragCurrentFruit(pointer) {
    if (!this.currentFruit || this.gameEnded || this.isPaused) return;
    if (this.controlState !== CONTROL_STATES.DRAGGING || pointer.id !== this.activePointerId) return;
    if (!Number.isFinite(pointer.worldX)) return;
    pointer.event?.preventDefault?.();
    this.positionCurrentFruit(pointer.worldX + this.dragOffsetX);
  }

  // Вертикальная линия наведения не участвует в физике.
  drawGuide(x) {
    this.guide.clear();
    this.guide.lineStyle(GUIDE_CONFIG.width, GUIDE_CONFIG.color, GUIDE_CONFIG.alpha);
    this.guide.lineBetween(x, spawnY(), x, SURFACE_Y + GUIDE_CONFIG.surfaceOffset);
    this.guide.setVisible(true);
  }

  releaseCurrentFruit(pointer = null) {
    if (!this.currentFruit || !this.canDrop || this.gameEnded || this.isPaused) return;
    if (this.controlState !== CONTROL_STATES.DRAGGING) return;
    if (pointer?.id !== undefined && pointer.id !== this.activePointerId) return;

    if (pointer && Number.isFinite(pointer.worldX)) this.dragCurrentFruit(pointer);
    this.positionCurrentFruit(this.lastDragX);
    this.controlState = CONTROL_STATES.RELEASED;
    this.activePointerId = null;
    this.activeNativePointerId = null;
    this.dragOffsetX = 0;
    this.canDrop = false;
    this.guide.setVisible(false);
    this.activateFruitPhysics(this.currentFruit);
    this.currentFruit.physics.setVelocity(
      0,
      PHYSICS_CONFIG.releaseVelocityY * GAMEPLAY.riseSpeedMultiplier,
    );
    this.playSound('release');
    this.currentFruit = null;
    if (!hasCompletedFirstDrop) {
      hasCompletedFirstDrop = true;
      ui.controlHint.classList.add('is-hidden');
      ui.controlHint.setAttribute('aria-hidden', 'true');
    }
    this.time.delayedCall(GAMEPLAY.spawnDelay, () => this.spawnFruit());
  }

  cancelCurrentFruitDrag(pointer = null) {
    if (this.controlState !== CONTROL_STATES.DRAGGING) return;
    if (pointer?.id !== undefined && pointer.id !== this.activePointerId) return;
    this.controlState = CONTROL_STATES.WAITING;
    this.activePointerId = null;
    this.activeNativePointerId = null;
    this.dragOffsetX = 0;
    if (this.currentFruit) this.positionCurrentFruit(this.lastDragX);
  }

  // ======================== Столкновения и объединение ========================

  handleCollisions(event) {
    if (this.gameEnded || this.isPaused) return;
    for (const pair of event.pairs) {
      this.trackSurfaceContact(pair, true);
      const first = pair.bodyA.fruitData;
      const second = pair.bodyB.fruitData;
      if (!first || !second || first === second) continue;
      if (first.level !== second.level || first.merging || second.merging) continue;
      if (first.isHeld || second.isHeld) continue;

      // Флаг ставится до очереди: один объект не может попасть в два merge одновременно.
      first.merging = true;
      second.merging = true;
      this.pendingMerges.push([first, second]);
    }
  }

  handleCollisionEnd(event) {
    for (const pair of event.pairs) this.trackSurfaceContact(pair, false);
  }

  trackSurfaceContact(pair, isTouching) {
    let fruitBody = null;
    if (pair.bodyA.label === 'surface' && pair.bodyB.fruitData) fruitBody = pair.bodyB;
    if (pair.bodyB.label === 'surface' && pair.bodyA.fruitData) fruitBody = pair.bodyA;
    if (!fruitBody) return;
    if (isTouching) this.touchingSurface.add(fruitBody.id);
    else this.touchingSurface.delete(fruitBody.id);
  }

  mergeFruits(first, second) {
    if (this.gameEnded || !first.physics?.body || !second.physics?.body) return;
    if (first.removed || second.removed) return;
    if (!this.fruits.has(first.physics.body.id) || !this.fruits.has(second.physics.body.id)) return;

    const x = (first.physics.x + second.physics.x) / 2;
    const y = (first.physics.y + second.physics.y) / 2;
    const velocityX = (first.physics.body.velocity.x + second.physics.body.velocity.x) / 2;
    const velocityY = (first.physics.body.velocity.y + second.physics.body.velocity.y) / 2;
    const isMaxLevelMerge = first.level === maxLevelIndex();
    const effectLevel = isMaxLevelMerge ? first.level : first.level + 1;
    const gainedPoints = isMaxLevelMerge
      ? this.world.maxLevelMergeScore
      : FRUITS[first.level + 1].points;
    const effectColor = FRUITS[effectLevel].color;
    const effectRadius = FRUITS[effectLevel].radius;

    this.playSound(isMaxLevelMerge ? 'maxMerge' : 'merge');

    this.removeFruit(first);
    this.removeFruit(second);

    this.score += gainedPoints;
    ui.score.textContent = formatNumber(this.score);
    const hasBrokenRecord = !this.recordSoundPlayed && this.score > this.bestScore;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      saveBestScore(this.bestScore);
      ui.hudBestScore.textContent = formatNumber(this.bestScore);
      ui.bestScore.textContent = formatNumber(this.bestScore);
    }
    if (hasBrokenRecord) {
      this.recordSoundPlayed = true;
      this.playSound('record');
    }
    this.addMergeEffects(x, y, effectColor, gainedPoints, effectRadius);

    // Две рыбы максимального уровня поглощаются без создания несуществующего следующего уровня.
    if (isMaxLevelMerge) return;

    const newLevel = first.level + 1;
    const merged = this.createFruit(x, y, newLevel);
    merged.physics.setVelocity(
      velocityX * EFFECTS_CONFIG.mergeVelocityRetentionX,
      Math.min(velocityY, EFFECTS_CONFIG.mergeMinimumRiseVelocity),
    );

    // Bounce применяется только к визуалу, круглый физический коллайдер не масштабируется.
    [merged.visual, merged.shine, merged.label].filter(Boolean).forEach((target) => {
      const targetScale = target === merged.visual ? merged.baseVisualScale : 1;
      target.setScale(targetScale * EFFECTS_CONFIG.mergeBounceStartScale);
      this.tweens.add({
        targets: target,
        scale: targetScale,
        duration: EFFECTS_CONFIG.mergeBounceDuration,
        ease: 'Back.Out',
      });
    });
    this.animateMergedWorldGlow(merged);

    this.unlockLevel(newLevel);
  }

  // ======================== Эффекты ========================

  addMergeEffects(x, y, color, points, effectRadius) {
    const glowConfig = this.world.glow;
    const ringColor = glowConfig ? color : EFFECTS_CONFIG.ringColor;
    const ringAlpha = glowConfig?.mergeBaseRingAlpha ?? EFFECTS_CONFIG.ringAlpha;
    const bubbleCount = glowConfig?.mergeBubbleCount ?? EFFECTS_CONFIG.mergeBubbleCount;

    this.addWorldMergeFlash(x, y, color, effectRadius);
    const ring = this.add.circle(x, y, EFFECTS_CONFIG.ringRadius, 0xffffff, 0)
      .setStrokeStyle(EFFECTS_CONFIG.ringStrokeWidth, ringColor, ringAlpha)
      .setDepth(EFFECTS_CONFIG.ringDepth);
    this.tweens.add({
      targets: ring,
      scale: EFFECTS_CONFIG.ringEndScale,
      alpha: 0,
      duration: EFFECTS_CONFIG.ringDuration,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });

    for (let index = 0; index < bubbleCount; index += 1) {
      const angle = (NUMBER_FORMAT_CONFIG.fullCircle * index) / bubbleCount;
      const bubble = this.add.circle(
        x,
        y,
        Phaser.Math.Between(EFFECTS_CONFIG.mergeBubbleMinRadius, EFFECTS_CONFIG.mergeBubbleMaxRadius),
        index % 2 ? 0xffffff : color,
        EFFECTS_CONFIG.mergeBubbleAlpha,
      ).setDepth(EFFECTS_CONFIG.mergeBubbleDepth);
      this.tweens.add({
        targets: bubble,
        x: x + Math.cos(angle) * Phaser.Math.Between(
          EFFECTS_CONFIG.mergeBubbleMinDistance,
          EFFECTS_CONFIG.mergeBubbleMaxDistance,
        ),
        y: y + Math.sin(angle) * Phaser.Math.Between(
          EFFECTS_CONFIG.mergeBubbleMinDistance,
          EFFECTS_CONFIG.mergeBubbleMaxDistance,
        ) - EFFECTS_CONFIG.mergeBubbleRiseOffset,
        alpha: 0,
        scale: EFFECTS_CONFIG.mergeBubbleEndScale,
        duration: Phaser.Math.Between(
          EFFECTS_CONFIG.mergeBubbleMinDuration,
          EFFECTS_CONFIG.mergeBubbleMaxDuration,
        ),
        ease: 'Cubic.Out',
        onComplete: () => bubble.destroy(),
      });
    }

    const pointsText = this.add.text(x, y - EFFECTS_CONFIG.pointsOffsetY, '+' + formatNumber(points), {
      fontFamily: 'Nunito, sans-serif',
      fontSize: `${EFFECTS_CONFIG.pointsFontSize}px`,
      fontStyle: '900',
      color: '#ffffff',
      shadow: {
        offsetX: 0,
        offsetY: EFFECTS_CONFIG.pointsShadowOffsetY,
        color: EFFECTS_CONFIG.pointsShadowColor,
        blur: EFFECTS_CONFIG.pointsShadowBlur,
        fill: true,
      },
    }).setOrigin(NUMBER_FORMAT_CONFIG.normalizedCenter).setDepth(EFFECTS_CONFIG.pointsDepth);
    this.tweens.add({
      targets: pointsText,
      y: y - EFFECTS_CONFIG.pointsEndOffsetY,
      alpha: 0,
      duration: EFFECTS_CONFIG.pointsDuration,
      ease: 'Cubic.Out',
      onComplete: () => pointsText.destroy(),
    });
  }

  addWorldMergeFlash(x, y, color, effectRadius) {
    const glowConfig = this.world.glow;
    if (!glowConfig) return;

    // Световое ядро не использует текстурный quad, поэтому не даёт прямоугольного артефакта.
    const core = this.add.circle(
      x,
      y,
      effectRadius * glowConfig.mergeCoreRadiusRatio,
      color,
      glowConfig.mergeCoreAlpha,
    ).setDepth(EFFECTS_CONFIG.ringDepth)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: core,
      scale: glowConfig.mergeCoreEndScale,
      alpha: 0,
      duration: glowConfig.mergeCoreDuration,
      ease: 'Sine.Out',
      onComplete: () => core.destroy(),
    });

    for (let index = 0; index < glowConfig.mergeParticleCount; index += 1) {
      const baseAngle = (NUMBER_FORMAT_CONFIG.fullCircle * index) / glowConfig.mergeParticleCount;
      const angle = baseAngle + Phaser.Math.FloatBetween(
        -glowConfig.mergeParticleAngleJitter,
        glowConfig.mergeParticleAngleJitter,
      );
      const distance = Phaser.Math.FloatBetween(
        effectRadius * glowConfig.mergeParticleMinDistanceRatio,
        effectRadius * glowConfig.mergeParticleMaxDistanceRatio,
      );
      const particle = this.add.circle(
        x,
        y,
        Phaser.Math.FloatBetween(
          glowConfig.mergeParticleMinRadius,
          glowConfig.mergeParticleMaxRadius,
        ),
        index % 3 === 0 ? 0xffffff : color,
        EFFECTS_CONFIG.mergeBubbleAlpha,
      )
        .setDepth(EFFECTS_CONFIG.mergeBubbleDepth)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance - EFFECTS_CONFIG.mergeBubbleRiseOffset,
        alpha: 0,
        scale: EFFECTS_CONFIG.mergeBubbleEndScale,
        duration: Phaser.Math.Between(
          glowConfig.mergeParticleMinDuration,
          glowConfig.mergeParticleMaxDuration,
        ),
        ease: 'Cubic.Out',
        onComplete: () => particle.destroy(),
      });
    }
  }

  animateMergedWorldGlow(fruit) {
    const glowConfig = this.world.glow;
    const glow = fruit.characterGlow;
    if (!glowConfig || !glow) return;

    // Merge-вспышка временно главнее idle, затем новый цикл начинается с нейтрали.
    fruit.idleTween?.pause();
    fruit.floatTween?.pause();
    this.resetCharacterIdleVisual(fruit);
    const glowBaseScaleX = fruit.glowBaseScaleX;
    const glowBaseScaleY = fruit.glowBaseScaleY;
    glow.setScale(
      glowBaseScaleX * glowConfig.mergedGlowStartScale,
      glowBaseScaleY * glowConfig.mergedGlowStartScale,
    )
      .setAlpha(glowConfig.mergedGlowStartAlpha);
    const glowTween = this.tweens.add({
      targets: glow,
      scaleX: glowBaseScaleX,
      scaleY: glowBaseScaleY,
      alpha: glowConfig.sphereAlpha,
      duration: glowConfig.mergedGlowSettleDuration,
      ease: 'Sine.easeOut',
      onComplete: () => {
        if (fruit.glowTween === glowTween) fruit.glowTween = null;
        if (!fruit.removed && fruit.idleTween) fruit.idleTween.restart();
        if (!fruit.removed && fruit.floatTween) fruit.floatTween.restart();
      },
    });
    fruit.glowTween = glowTween;
  }

  createTrailBubble(fruit) {
    const radius = FRUITS[fruit.level].radius;
    const bubble = this.add.circle(
      fruit.physics.x + Phaser.Math.Between(
        -Math.floor(radius * EFFECTS_CONFIG.trailHorizontalRadiusRatio),
        Math.floor(radius * EFFECTS_CONFIG.trailHorizontalRadiusRatio),
      ),
      fruit.physics.y + radius * EFFECTS_CONFIG.trailVerticalRadiusRatio,
      Phaser.Math.Between(EFFECTS_CONFIG.trailMinRadius, EFFECTS_CONFIG.trailMaxRadius),
      0xffffff,
      EFFECTS_CONFIG.trailAlpha,
    ).setStrokeStyle(
      EFFECTS_CONFIG.trailStrokeWidth,
      0xffffff,
      EFFECTS_CONFIG.trailStrokeAlpha,
    ).setDepth(EFFECTS_CONFIG.trailDepth);
    this.tweens.add({
      targets: bubble,
      y: bubble.y - Phaser.Math.Between(EFFECTS_CONFIG.trailMinRise, EFFECTS_CONFIG.trailMaxRise),
      x: bubble.x + Phaser.Math.Between(-EFFECTS_CONFIG.trailHorizontalDrift, EFFECTS_CONFIG.trailHorizontalDrift),
      alpha: 0,
      scale: EFFECTS_CONFIG.trailEndScale,
      duration: Phaser.Math.Between(EFFECTS_CONFIG.trailMinDuration, EFFECTS_CONFIG.trailMaxDuration),
      onComplete: () => bubble.destroy(),
    });
  }

  // ======================== Открытие уровней ========================

  unlockLevel(levelIndex) {
    if (this.unlockedLevels.has(levelIndex)) return;
    this.unlockedLevels.add(levelIndex);
    const isNewCollectionLevel = !this.collectionUnlockedLevels.has(levelIndex);
    if (isNewCollectionLevel) {
      this.collectionUnlockedLevels.add(levelIndex);
      saveCollectionLevels(this.collectionUnlockedLevels);
    }
    this.playSound('unlock');
    const slot = ui.progressSlots[levelIndex];
    this.renderProgressSlot(levelIndex, true);

    for (let index = 0; index < EFFECTS_CONFIG.unlockBubbleCount; index += 1) {
      const bubble = document.createElement('i');
      bubble.className = 'unlock-bubble';
      bubble.style.left = `${EFFECTS_CONFIG.unlockBubbleStartLeft + index * EFFECTS_CONFIG.unlockBubbleLeftStep}%`;
      bubble.style.bottom = `${EFFECTS_CONFIG.unlockBubbleBottom}%`;
      bubble.style.setProperty(
        '--bubble-x',
        `${(index - EFFECTS_CONFIG.unlockBubbleCenterIndex) * EFFECTS_CONFIG.unlockBubbleDriftStep}px`,
      );
      slot.appendChild(bubble);
      window.setTimeout(() => bubble.remove(), EFFECTS_CONFIG.unlockBubbleDuration);
    }

    if (isNewCollectionLevel) this.showFishUnlock(levelIndex);
  }

  // ======================== Физика и игровой цикл ========================

  removeFruit(fruit) {
    if (!fruit?.physics?.body || fruit.removed) return;
    fruit.removed = true;
    this.disposeWorldCharacterEffects(fruit);
    const bodyId = fruit.physics.body.id;
    this.fruits.delete(bodyId);
    this.dangerSince.delete(bodyId);
    this.touchingSurface.delete(bodyId);
    fruit.label?.destroy();
    fruit.shine?.destroy();
    fruit.visual.destroy();
    fruit.physics.destroy();
  }

  // Удаляем таймеры и glow одного персонажа при merge или уничтожении.
  disposeWorldCharacterEffects(fruit) {
    if (!fruit) return;
    this.stopBlinkAnimation(fruit);
    this.stopCharacterIdleAnimation(fruit);
    fruit.glowTween?.stop();
    fruit.glowTween?.remove();
    fruit.characterGlow?.destroy();
    fruit.ambientGlow?.destroy();
    fruit.glowTween = null;
    fruit.characterGlow = null;
    fruit.ambientGlow = null;
  }

  // При перезапуске сцены не оставляем бесконечные tweens и таймеры прошлого мира.
  disposeWorldCharacterEffectsForShutdown() {
    const characters = new Set(this.fruits?.values() || []);
    if (this.currentFruit) characters.add(this.currentFruit);
    characters.forEach((fruit) => this.disposeWorldCharacterEffects(fruit));
  }

  applyAdaptiveBuoyancy(fruit) {
    const body = fruit.physics.body;
    if (body.isSleeping) return;

    const config = FRUITS[fruit.level];
    const bodyTop = fruit.physics.y - config.radius;
    const distanceFromSurface = Math.max(0, bodyTop - SURFACE_Y);
    let buoyancyFactor = Phaser.Math.Clamp(
      distanceFromSurface / GAMEPLAY.surfaceFadeDistance,
      0,
      1,
    );

    if (this.touchingSurface.has(body.id)) buoyancyFactor = 0;

    // В плотной почти неподвижной куче дополнительное давление вверх почти исчезает.
    const isStableUpperPile = fruit.physics.y < SURFACE_Y + PHYSICS_CONFIG.stablePileDistance
      && body.speed < PHYSICS_CONFIG.stablePileSpeed;
    if (isStableUpperPile) buoyancyFactor = 0;

    if (buoyancyFactor > PHYSICS_CONFIG.minimumBuoyancyFactor) {
      fruit.physics.applyForce({
        x: 0,
        y: GAMEPLAY.buoyancyForce * GAMEPLAY.riseSpeedMultiplier * body.mass * buoyancyFactor,
      });
    }

    // Мягкое затухание вращения без ручного изменения позиции или угла body.
    if (Math.abs(body.angularVelocity) > PHYSICS_CONFIG.minimumAngularVelocity) {
      fruit.physics.setAngularVelocity(body.angularVelocity * GAMEPLAY.angularDamping);
    }
  }

  update(time) {
    if (this.gameEnded || this.isPaused) return;

    // Одно объединение за кадр предотвращает каскадное изменение Matter-тел.
    const pendingMerge = this.pendingMerges.shift();
    if (pendingMerge) this.mergeFruits(pendingMerge[0], pendingMerge[1]);

    let danger = false;
    let qaMaxSpeed = 0;
    let qaMaxAngularVelocity = 0;
    let qaSleepingBodies = 0;
    for (const [bodyId, fruit] of this.fruits) {
      if (!fruit.physics?.body) continue;
      this.syncFruitVisual(fruit, time);
      this.applyAdaptiveBuoyancy(fruit);

      if (QA_PHYSICS_PILE) {
        qaMaxSpeed = Math.max(qaMaxSpeed, fruit.physics.body.speed);
        qaMaxAngularVelocity = Math.max(qaMaxAngularVelocity, Math.abs(fruit.physics.body.angularVelocity));
        if (fruit.physics.body.isSleeping) qaSleepingBodies += 1;
      }

      const maximumRiseSpeed = GAMEPLAY.maxRiseSpeed * GAMEPLAY.riseSpeedMultiplier;
      if (fruit.physics.body.velocity.y < -maximumRiseSpeed) {
        fruit.physics.setVelocityY(-maximumRiseSpeed);
      }
      if (Math.abs(fruit.physics.body.velocity.x) > PHYSICS_CONFIG.maximumHorizontalSpeed) {
        fruit.physics.setVelocityX(Phaser.Math.Clamp(
          fruit.physics.body.velocity.x,
          -PHYSICS_CONFIG.maximumHorizontalSpeed,
          PHYSICS_CONFIG.maximumHorizontalSpeed,
        ));
      }

      const trailInterval = TIMING_CONFIG.trailBubbleBaseInterval
        + fruit.level * TIMING_CONFIG.trailBubbleLevelInterval;
      if (fruit.physics.body.velocity.y < PHYSICS_CONFIG.trailMinimumRiseSpeed
        && time - fruit.lastBubbleAt > trailInterval) {
        fruit.lastBubbleAt = time;
        this.createTrailBubble(fruit);
      }

      const cannotTriggerGameOver = fruit.isHeld
        || fruit.merging
        || fruit.removed
        || this.time.now - fruit.bornAt < GAMEPLAY.dangerStabilizationDelay
        || fruit.physics.body.speed > GAMEPLAY.dangerStableSpeed;
      if (cannotTriggerGameOver) {
        this.dangerSince.delete(bodyId);
        continue;
      }

      const collisionRadius = FRUITS[fruit.level].radius;
      const fishBottomY = fruit.physics.body.position.y + collisionRadius;
      const isBelowGameOverLine = fishBottomY >= this.gameOverLineY;
      if (isBelowGameOverLine) {
        danger = true;
        if (!this.dangerSince.has(bodyId)) this.dangerSince.set(bodyId, this.time.now);
        if (this.time.now - this.dangerSince.get(bodyId) >= GAMEPLAY.dangerDelay) {
          this.endGame();
          return;
        }
      } else {
        this.dangerSince.delete(bodyId);
      }
    }

    ui.warning.classList.toggle('is-visible', danger);
    ui.gameWrap.classList.toggle('is-danger', danger);
    if (QA_PHYSICS_PILE) {
      ui.gameWrap.dataset.qaMaxSpeed = qaMaxSpeed.toFixed(4);
      ui.gameWrap.dataset.qaMaxAngularVelocity = qaMaxAngularVelocity.toFixed(5);
      ui.gameWrap.dataset.qaSleepingBodies = String(qaSleepingBodies);
      ui.gameWrap.dataset.qaBodyCount = String(this.fruits.size);
    }
    if (QA_FISH_ANIMATION) {
      const allCharacters = new Set(this.fruits.values());
      if (this.currentFruit) allCharacters.add(this.currentFruit);
      const animatedFruits = new Set([...this.fruits.values()].filter((fruit) => fruit.eyesClosed));
      if (this.currentFruit?.eyesClosed) animatedFruits.add(this.currentFruit);
      const [animatedFruit] = animatedFruits;
      const idleCharacters = [...allCharacters].filter((fruit) => fruit.idleTween);
      const idleTweenCount = idleCharacters.reduce(
        (count, fruit) => count + Number(Boolean(fruit.idleTween)) + Number(Boolean(fruit.floatTween)),
        0,
      );
      const pulsingJellyfish = idleCharacters.find((fruit) => fruit.idleState);
      const sampleIdleCharacter = pulsingJellyfish || idleCharacters[0];
      ui.gameWrap.dataset.qaAnimatedLevelOne = String(Boolean(animatedFruit));
      ui.gameWrap.dataset.qaAnimatedFishCount = String(animatedFruits.size);
      ui.gameWrap.dataset.qaIdleTweenCount = String(idleTweenCount);
      ui.gameWrap.dataset.qaStoppedIdleAnimationCount = String(this.stoppedIdleAnimationCount);
      ui.gameWrap.dataset.qaIdleProgress = pulsingJellyfish
        ? pulsingJellyfish.idleState.progress.toFixed(4)
        : '';
      ui.gameWrap.dataset.qaIdleScaleX = sampleIdleCharacter
        ? sampleIdleCharacter.idleVisual.scaleX.toFixed(4)
        : '';
      ui.gameWrap.dataset.qaIdleScaleY = sampleIdleCharacter
        ? sampleIdleCharacter.idleVisual.scaleY.toFixed(4)
        : '';
      ui.gameWrap.dataset.qaIdleOffsetY = sampleIdleCharacter
        ? sampleIdleCharacter.idleVisual.y.toFixed(3)
        : '';
      ui.gameWrap.dataset.qaIdleRotation = sampleIdleCharacter
        ? Phaser.Math.RadToDeg(sampleIdleCharacter.idleVisual.rotation).toFixed(3)
        : '';
      ui.gameWrap.dataset.qaIdleGlowAlpha = pulsingJellyfish?.characterGlow
        ? pulsingJellyfish.characterGlow.alpha.toFixed(4)
        : '';
      ui.gameWrap.dataset.qaEyesClosed = animatedFruit
        ? String(animatedFruit.eyesClosed.visible)
        : '';
      ui.gameWrap.dataset.qaAnimationTimerCount = String(
        [...animatedFruits].reduce((timerCount, fruit) => timerCount + fruit.animationTimers.size, 0),
      );
      ui.gameWrap.dataset.qaStoppedBlinkAnimationCount = String(this.stoppedBlinkAnimationCount);
    }
  }

  // ======================== Верхний интерфейс и состояния игры ========================

  updateNextPreview() {
    const next = FRUITS[this.nextLevel];
    if (this.textures.exists(next.textureKey)) {
      ui.nextFish.style.background = `url(${next.texturePath}) center / contain no-repeat`;
      ui.nextFish.textContent = '';
    } else {
      ui.nextFish.style.background = next.cssColor;
      ui.nextFish.textContent = next.level;
    }
    ui.nextFish.setAttribute('aria-label', t('a11y.nextCharacter', { level: next.level }));
  }

  openMainMenu() {
    this.isMainMenuOpen = true;
    ui.mainMenuWorld.textContent = worldName(this.world);
    const collection = readCollectionLevels(this.world);
    ui.mainMenuProgress.textContent = t('menu.progress', {
      unlocked: formatNumber(collection.size),
      total: formatNumber(this.world.maxSupportedLevels),
    });
    ui.mainMenu.hidden = false;
    this.cancelCurrentFruitDrag();
    this.matter.world.pause();
    this.time.paused = true;
    this.setWorldCharacterAnimationsPaused(true);
    this.setSharkPaused(true);
  }

  closeMainMenu() {
    this.isMainMenuOpen = false;
    ui.mainMenu.hidden = true;
    if (this.gameEnded || this.isPaused) return;
    this.time.paused = false;
    this.matter.world.resume();
    this.setWorldCharacterAnimationsPaused(false);
    this.setSharkPaused(false);
    if (this.currentFruit?.isHeld) this.positionCurrentFruit(this.lastDragX);
    this.startAmbient();
  }

  setPaused(value) {
    if (this.gameEnded || this.isPaused === value) return;
    if (value) this.cancelCurrentFruitDrag();
    this.isPaused = value;
    ui.pauseModal.hidden = !value;
    ui.pauseButton.setAttribute('aria-label', t(value ? 'a11y.resumeGame' : 'a11y.pause'));
    ui.pauseButton.classList.remove('is-bouncing');
    void ui.pauseButton.offsetWidth;
    ui.pauseButton.classList.add('is-bouncing');

    if (value) {
      this.matter.world.pause();
      this.time.paused = true;
    } else {
      this.time.paused = false;
      this.matter.world.resume();
      if (this.currentFruit?.isHeld) this.positionCurrentFruit(this.lastDragX);
    }
    this.setSharkPaused(value);
    this.setWorldCharacterAnimationsPaused(value);
    this.startAmbient();
  }

  endGame() {
    if (this.gameEnded) return;
    this.gameEnded = true;
    // Текущий проход продолжается, но новые акулы после Game Over не появляются.
    this.sharkCheckTimer?.remove(false);
    this.sharkCheckTimer = null;
    if (!this.gameOverSoundPlayed) {
      this.gameOverSoundPlayed = true;
      this.playSound('gameOver');
    }
    this.startAmbient();
    this.canDrop = false;
    this.controlState = CONTROL_STATES.RELEASED;
    this.activePointerId = null;
    this.activeNativePointerId = null;
    this.guide.clear();
    this.guide.setVisible(false);
    ui.warning.classList.remove('is-visible');
    ui.gameWrap.classList.remove('is-danger');
    this.matter.world.pause();
    this.setWorldCharacterAnimationsPaused(true);

    const isNewRecord = this.score > this.bestScore;
    if (isNewRecord) {
      this.bestScore = this.score;
      saveBestScore(this.bestScore);
    }
    ui.finalScore.textContent = formatNumber(this.score);
    ui.bestScore.textContent = formatNumber(this.bestScore);
    ui.newRecordBadge.hidden = !isNewRecord;
    ui.gameOver.hidden = false;
  }

  // ======================== Локализация интерфейса ========================

  refreshLocalizedInterface() {
    applyTranslations();
    ui.currentLanguageName.textContent = getLanguageLabel();
    this.updateSoundToggleInterface();
    this.updateAmbientToggleInterface();

    ui.score.textContent = formatNumber(this.score);
    ui.hudBestScore.textContent = formatNumber(this.bestScore);
    ui.finalScore.textContent = formatNumber(this.score);
    ui.bestScore.textContent = formatNumber(this.bestScore);
    ui.pauseButton.setAttribute('aria-label', t(this.isPaused ? 'a11y.resumeGame' : 'a11y.pause'));

    if (FRUITS[this.nextLevel]) this.updateNextPreview();
    this.renderProgression();

    ui.mainMenuWorld.textContent = worldName(this.world);
    const collection = readCollectionLevels(this.world);
    ui.mainMenuProgress.textContent = t('menu.progress', {
      unlocked: formatNumber(collection.size),
      total: formatNumber(this.world.maxSupportedLevels),
    });

    if (!ui.worldsModal.hidden) renderWorldCards();
    if (!ui.atlasModal.hidden) this.renderAtlas();

    const detailLevel = Number.parseInt(ui.fishDetailModal.dataset.level || '', 10);
    const detailWorld = WORLDS[ui.fishDetailModal.dataset.world];
    const detailCharacter = detailWorld?.characters[detailLevel];
    if (!ui.fishDetailModal.hidden && detailCharacter) {
      ui.fishDetailLevel.textContent = t('atlas.level', { level: detailCharacter.level });
      ui.fishDetailName.textContent = characterName(detailCharacter);
      ui.fishDetailCharacter.textContent = characterTrait(detailCharacter);
      ui.fishDetailDescription.textContent = characterDescription(detailCharacter);
      ui.fishDetailImage.alt = characterName(detailCharacter);
    }

    const unlockLevel = Number.parseInt(ui.fishUnlockModal.dataset.level || '', 10);
    const unlockCharacter = FRUITS[unlockLevel];
    if (!ui.fishUnlockModal.hidden && unlockCharacter) {
      ui.fishUnlockName.textContent = characterName(unlockCharacter);
      ui.fishUnlockDescription.textContent = characterDescription(unlockCharacter);
      ui.fishUnlockImage.alt = characterName(unlockCharacter);
    }

    this.gameOverDebugLabel?.setText(t('debug.gameOverLimit'));
    renderLanguageOptions();
  }

  resetInterface() {
    ui.score.textContent = '0';
    ui.hudBestScore.textContent = formatNumber(this.bestScore);
    ui.finalScore.textContent = '0';
    ui.bestScore.textContent = formatNumber(this.bestScore);
    ui.pauseButton.setAttribute('aria-label', t('a11y.pause'));
    ui.controlHint.classList.toggle('is-hidden', hasCompletedFirstDrop);
    ui.controlHint.setAttribute('aria-hidden', String(hasCompletedFirstDrop));
    ui.warning.classList.remove('is-visible');
    ui.gameWrap.classList.remove('is-danger');
    ui.pauseModal.hidden = true;
    ui.worldsModal.hidden = true;
    ui.gameOver.hidden = true;
    ui.settingsModal.hidden = true;
    ui.languageModal.hidden = true;
    ui.newRecordBadge.hidden = true;
    ui.atlasModal.hidden = true;
    ui.gameWrap.classList.remove('is-atlas-open');
    ui.fishDetailModal.hidden = true;
    ui.fishUnlockModal.hidden = true;
    ui.fishUnlockModal.classList.remove('can-dismiss');
    this.updateSoundToggleInterface();
    this.updateAmbientToggleInterface();
    this.renderProgression();
    this.refreshLocalizedInterface();
    this.startAmbient();
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: gameHeight,
  transparent: true,
  resolution: Math.min(window.devicePixelRatio || 1, SCENE_CONFIG.maximumRenderResolution),
  render: {
    antialias: false,
    antialiasGL: false,
    pixelArt: true,
    roundPixels: true,
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { y: 0 },
      enableSleep: true,
      debug: DEBUG_PHYSICS,
    },
  },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: FruitScene,
});

let resizeFrame = 0;
function resizeGameToViewport() {
  window.cancelAnimationFrame(resizeFrame);
  resizeFrame = window.requestAnimationFrame(() => {
    const nextHeight = calculateGameHeight();
    if (nextHeight === gameHeight) return;
    gameHeight = nextHeight;
    game.scale.resize(GAME_WIDTH, gameHeight);
  });
}

window.addEventListener('resize', resizeGameToViewport, { passive: true });
window.visualViewport?.addEventListener('resize', resizeGameToViewport, { passive: true });

function activeScene() {
  return game.scene.getScene('FruitScene');
}

function restartGame() {
  const scene = activeScene();
  scene.playSound('button');
  startSceneWithoutMainMenu = true;
  scene.time.paused = false;
  scene.matter.world.resume();
  ui.pauseModal.hidden = true;
  ui.settingsModal.hidden = true;
  ui.gameOver.hidden = true;
  scene.scene.restart();
}

function renderWorldCards() {
  ui.worldsGrid.replaceChildren();
  Object.values(WORLDS).forEach((world) => {
    const collection = readCollectionLevels(world);
    const card = document.createElement('article');
    card.className = `world-card glass ${world.themeClass}${world.id === activeWorldId ? ' is-selected' : ''}`;
    const previewWrap = document.createElement('div');
    previewWrap.className = 'world-card-preview';
    previewWrap.style.backgroundImage = `linear-gradient(180deg, transparent 30%, rgba(0, 13, 44, .42)), url(${world.backgrounds.seabedPath})`;
    const preview = document.createElement('img');
    preview.src = world.characters[world.previewCharacterLevel - 1].texturePath;
    preview.alt = worldName(world);
    previewWrap.appendChild(preview);
    const title = document.createElement('h3');
    title.textContent = worldName(world);
    const description = document.createElement('p');
    description.textContent = worldDescription(world);
    const progress = document.createElement('span');
    progress.className = 'world-card-progress';
    progress.textContent = t('worlds.progress', {
      unlocked: formatNumber(collection.size),
      total: formatNumber(world.maxSupportedLevels),
    });
    const selectedMark = document.createElement('span');
    selectedMark.className = 'world-card-selected-mark';
    selectedMark.textContent = t('worlds.selected');
    selectedMark.hidden = world.id !== activeWorldId;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'modal-button glass glass-button glass-button-secondary';
    button.textContent = t(world.id === activeWorldId ? 'worlds.selectedButton' : 'worlds.selectButton');
    button.disabled = world.id === activeWorldId;
    button.addEventListener('click', () => selectWorld(world.id));
    card.append(previewWrap, selectedMark, title, description, progress, button);
    ui.worldsGrid.appendChild(card);
  });
}

function renderLanguageOptions() {
  ui.currentLanguageName.textContent = getLanguageLabel();
  ui.languageList.replaceChildren();
  LANGUAGE_OPTIONS.forEach(({ locale, label }) => {
    const button = document.createElement('button');
    const isSelected = locale === getLocale();
    button.type = 'button';
    button.className = 'language-option glass glass-button glass-button-tertiary'
      + (isSelected ? ' is-selected' : '');
    button.dataset.locale = locale;
    button.setAttribute('aria-pressed', String(isSelected));

    const name = document.createElement('span');
    name.textContent = label;
    const mark = document.createElement('span');
    mark.className = 'language-option-mark';
    mark.textContent = isSelected ? '✓' : '';
    mark.setAttribute('aria-hidden', 'true');

    button.append(name, mark);
    button.addEventListener('click', () => {
      if (locale === getLocale()) return;
      activeScene().playSound('button');
      setLocale(locale);
    });
    ui.languageList.appendChild(button);
  });
}

function openLanguageModal() {
  activeScene().playSound('button');
  renderLanguageOptions();
  ui.languageModal.hidden = false;
}

function closeLanguageModal() {
  ui.languageModal.hidden = true;
}

function openWorldsModal() {
  activeScene().playSound('button');
  renderWorldCards();
  ui.worldsModal.hidden = false;
}

function closeWorldsModal() {
  ui.worldsModal.hidden = true;
}

function openSettingsModal() {
  activeScene().playSound('button');
  ui.currentLanguageName.textContent = getLanguageLabel();
  ui.settingsModal.hidden = false;
}

function closeSettingsModal() {
  closeLanguageModal();
  ui.settingsModal.hidden = true;
}

function returnToMainMenu() {
  const scene = activeScene();
  scene.playSound('button');
  forceMainMenuAfterRestart = true;
  startSceneWithoutMainMenu = false;
  ui.pauseModal.hidden = true;
  ui.settingsModal.hidden = true;
  ui.gameOver.hidden = true;
  scene.time.paused = false;
  scene.matter.world.resume();
  scene.scene.restart();
}

function selectWorld(worldId) {
  if (!WORLDS[worldId] || worldId === activeWorldId) return;
  const scene = activeScene();
  scene.playSound('button');
  saveSelectedWorldId(worldId);
  activeWorldId = worldId;
  activeWorld = WORLDS[worldId];
  FRUITS = activeWorld.characters;
  FISH_DATA = FRUITS;
  rebuildProgressionSlots();
  ui.progressSlots = [...progressionElement.querySelectorAll('.progress-slot')];
  closeWorldsModal();
  ui.pauseModal.hidden = true;
  ui.gameOver.hidden = true;
  scene.time.paused = false;
  scene.matter.world.resume();
  scene.scene.restart();
}

ui.pauseButton.addEventListener('click', () => {
  const scene = activeScene();
  if (!scene?.scene.isActive()) return;
  scene.playSound('button');
  scene.setPaused(!scene.isPaused);
});
ui.continueButton.addEventListener('click', () => {
  const scene = activeScene();
  scene.playSound('button');
  scene.setPaused(false);
});
ui.soundToggleButton.addEventListener('click', () => {
  const scene = activeScene();
  if (scene.soundEnabled) scene.playSound('button');
  scene.toggleSound();
  if (scene.soundEnabled) scene.playSound('button');
});
ui.ambientToggleButton.addEventListener('click', () => {
  const scene = activeScene();
  scene.playSound('button');
  scene.setAmbientEnabled(!scene.ambientEnabled);
});
ui.mainSoundToggleButton.addEventListener('click', () => {
  const scene = activeScene();
  if (scene.soundEnabled) scene.playSound('button');
  scene.toggleSound();
  if (scene.soundEnabled) scene.playSound('button');
});
ui.pauseRestartButton.addEventListener('click', restartGame);
ui.restartButton.addEventListener('click', restartGame);
ui.playButton.addEventListener('click', () => {
  const scene = activeScene();
  scene.playSound('button');
  scene.closeMainMenu();
});
ui.worldsButton.addEventListener('click', openWorldsModal);
ui.atlasButton.addEventListener('click', () => activeScene().openAtlas());
ui.settingsButton.addEventListener('click', openSettingsModal);
ui.pauseSettingsButton.addEventListener('click', openSettingsModal);
ui.languageButton.addEventListener('click', openLanguageModal);
ui.languageCloseButton.addEventListener('click', closeLanguageModal);
ui.languageModal.addEventListener('click', (event) => {
  if (event.target === ui.languageModal) closeLanguageModal();
});
ui.settingsCloseButton.addEventListener('click', closeSettingsModal);
ui.settingsModal.addEventListener('click', (event) => {
  if (event.target === ui.settingsModal) closeSettingsModal();
});
ui.pauseWorldsButton.addEventListener('click', openWorldsModal);
ui.gameOverMenuButton.addEventListener('click', returnToMainMenu);
ui.worldsCloseButton.addEventListener('click', closeWorldsModal);
ui.worldsModal.addEventListener('click', (event) => {
  if (event.target === ui.worldsModal) closeWorldsModal();
});

ui.progression.addEventListener('click', (event) => {
  if (!event.target.closest('.progress-slot')) return;
  activeScene().openAtlas();
});
ui.atlasCloseButton.addEventListener('click', () => activeScene().closeAtlas());
ui.atlasModal.addEventListener('click', (event) => {
  if (event.target === ui.atlasModal) activeScene().closeAtlas();
});
ui.fishDetailCloseButton.addEventListener('click', () => activeScene().closeFishDetail());
ui.fishDetailModal.addEventListener('click', (event) => {
  if (event.target === ui.fishDetailModal) activeScene().closeFishDetail();
});
ui.fishUnlockModal.addEventListener('click', () => activeScene().closeFishUnlock());
// Единый возврат из внутренних экранов для Escape и Android Back.
function closeTopModal(includeUnlock = false) {
  const scene = activeScene();
  if (!ui.languageModal.hidden) closeLanguageModal();
  else if (!ui.settingsModal.hidden) closeSettingsModal();
  else if (!ui.worldsModal.hidden) closeWorldsModal();
  else if (!ui.fishDetailModal.hidden) scene.closeFishDetail();
  else if (!ui.atlasModal.hidden) scene.closeAtlas();
  else if (includeUnlock && !ui.fishUnlockModal.hidden) scene.closeFishUnlock(true);
  else return false;
  return true;
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeTopModal();
});

// ---------- Android lifecycle: текущая пауза, аудио и Phaser loop ----------
let nativeSuspendedState = null;
void initializeNativeApp({
  onBackground() {
    if (nativeSuspendedState) return;
    const scene = activeScene();
    const ready = scene?.scene?.isActive();
    if (ready) {
      // Поздно завершившийся unlock AudioContext не должен запускать звук в фоне.
      scene.nativeInBackground = true;
      scene.cancelCurrentFruitDrag();
      if (!scene.isMainMenuOpen && !scene.gameEnded && !scene.isPaused) scene.setPaused(true);
      scene.pauseAmbient();
      Object.values(scene.sounds || {}).forEach((sound) => sound?.stop());
      scene.refreshAudioContextState(true);
      scene.matter.world.pause();
      nativeSuspendedState = {
        scene,
        timePaused: scene.time.paused,
        tweensPaused: scene.tweens.paused,
      };
      scene.time.paused = true;
      scene.tweens.pauseAll();
    } else {
      nativeSuspendedState = { scene: null };
    }
    // wake() сбрасывает измерение времени, поэтому нет большого timestep после возврата.
    game.loop.sleep();
  },
  onForeground() {
    if (!nativeSuspendedState) return;
    const suspended = nativeSuspendedState;
    nativeSuspendedState = null;
    if (suspended.scene) {
      suspended.scene.nativeInBackground = false;
      suspended.scene.time.paused = suspended.timePaused;
      if (!suspended.tweensPaused) suspended.scene.tweens.resumeAll();
      suspended.scene.refreshAudioContextState(true);
    }
    game.loop.wake();
    resizeGameToViewport();
    // Продолжение партии и разблокировка аудио происходят по действию пользователя.
  },
  onBack() {
    if (closeTopModal(true)) return true;
    const scene = activeScene();
    if (!scene?.scene?.isActive()) return true;
    if (scene.isMainMenuOpen) return false;
    if (scene.gameEnded || scene.isPaused) returnToMainMenu();
    else scene.setPaused(true);
    return true;
  },
});
game.events.once(Phaser.Core.Events.DESTROY, () => { void disposeNativeApp(); });

onLanguageChanged(() => {
  const scene = activeScene();
  if (scene?.scene?.isActive()) scene.refreshLocalizedInterface();
  else renderLanguageOptions();
});

// Небольшой публичный объект помогает проверять состояние прототипа в консоли.
window.fuguGame = game;
