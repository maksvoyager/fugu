import { FRUITS, STARTING_LEVELS, GAMEPLAY, PROGRESS_UI } from './fruits.js';

const Phaser = window.Phaser;

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
  spawnBottomOffset: 200,
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
const SEABED_TEXTURE_KEY = 'bottom-seabed';
const SEABED_TEXTURE_PATH = './assets/backgrounds/bottom_seabed.png';
const WATER_SURFACE_TEXTURE_KEY = 'water-surface';
const WATER_SURFACE_TEXTURE_PATH = './assets/backgrounds/water_surface.png';
const BEST_SCORE_KEY = 'fugu-merge-best-score';
const SOUND_ENABLED_KEY = 'fugu-merge-sound-enabled';
const AMBIENT_ENABLED_KEY = 'fugu-merge-ambient-enabled';
const URL_OPTIONS = new URLSearchParams(window.location.search);
const DEBUG_PHYSICS = URL_OPTIONS.has('debugPhysics');
const QA_MAX_MERGE = URL_OPTIONS.has('qaMaxMerge');
const QA_CREATE_MAX_LEVEL = URL_OPTIONS.has('qaCreateMaxLevel');
const QA_PHYSICS_PILE = URL_OPTIONS.has('qaPhysicsPile');
const QA_GAME_OVER = URL_OPTIONS.has('qaGameOver');
const QA_PROGRESSION = URL_OPTIONS.has('qaProgression');
const QA_AUDIO_EVENTS = URL_OPTIONS.has('qaAudioEvents');
const QA_NEXT_LEVEL = Number.parseInt(
  URL_OPTIONS.get('qaNextLevel') || '',
  NUMBER_FORMAT_CONFIG.decimalRadix,
) - 1;
const QA_NEXT_PREVIEW_LEVEL = Number.parseInt(
  URL_OPTIONS.get('qaNextPreview') || '',
  NUMBER_FORMAT_CONFIG.decimalRadix,
) - 1;
const DEBUG_GAME_OVER_LINE = URL_OPTIONS.has('debugGameOverLine');
const MAX_LEVEL_INDEX = FRUITS.length - 1;
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
FRUITS.forEach((config, index) => {
  const slot = document.createElement('div');
  slot.className = `progress-slot${index === 0 ? ' is-unlocked' : ''}`;
  slot.dataset.level = String(config.level);
  slot.setAttribute('aria-label', `Уровень ${config.level} ${index === 0 ? 'открыт' : 'закрыт'}`);
  progressionElement.appendChild(slot);
});

const ui = {
  gameWrap: document.querySelector('#game-wrap'),
  score: document.querySelector('#score'),
  hudBestScore: document.querySelector('#hud-best-score'),
  nextFish: document.querySelector('#next-fruit'),
  controlHint: document.querySelector('#control-hint'),
  warning: document.querySelector('#warning'),
  pauseButton: document.querySelector('#pause-button'),
  pauseModal: document.querySelector('#pause-modal'),
  continueButton: document.querySelector('#continue-button'),
  soundToggleButton: document.querySelector('#sound-toggle-button'),
  soundToggleText: document.querySelector('#sound-toggle-text'),
  ambientToggleButton: document.querySelector('#ambient-toggle-button'),
  ambientToggleText: document.querySelector('#ambient-toggle-text'),
  pauseRestartButton: document.querySelector('#pause-restart-button'),
  gameOver: document.querySelector('#game-over'),
  finalScore: document.querySelector('#final-score'),
  bestScore: document.querySelector('#best-score'),
  restartButton: document.querySelector('#restart-button'),
  progression: progressionElement,
  progressSlots: [...document.querySelectorAll('.progress-slot')],
};

const warnedProgressAssets = new Set();
let warnedMissingSeabedForGameOver = false;
// Флаг живёт до перезагрузки страницы и не сбрасывается при рестарте Phaser-сцены.
let hasCompletedFirstDrop = false;

function readBestScore() {
  try {
    return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveBestScore(value) {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(value));
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

class FruitScene extends Phaser.Scene {
  // ======================== Инициализация сцены ========================

  constructor() {
    super('FruitScene');
    this.fruits = new Map();
    this.dangerSince = new Map();
    this.touchingSurface = new Set();
    this.pendingMerges = [];
    this.boundBodies = [];
    this.seabed = null;
    this.gameOverLineY = gameHeight * GAMEPLAY.gameOverFallbackRatio;
    this.gameOverDebugGraphics = null;
    this.gameOverDebugLabel = null;
    this.unlockedLevels = new Set([0]);
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
      console.warn('[Audio] Failed to load asset:', file.key, file.src);
    };
    this.recordSoundPlayed = false;
    this.gameOverSoundPlayed = false;
  }

  preload() {
    this.load.off('loaderror', this.handleAssetLoadError);
    this.load.on('loaderror', this.handleAssetLoadError);

    // Все изображения из единой конфигурации загружаются заранее; при ошибке используется fallback-круг.
    FRUITS.forEach((config) => this.load.image(config.textureKey, config.texturePath));
    // Универсальная закрытая рыба загружается один раз и переиспользуется во всех слотах.
    this.load.image(PROGRESS_UI.lockedTextureKey, PROGRESS_UI.lockedTexturePath);
    this.load.image(SEABED_TEXTURE_KEY, SEABED_TEXTURE_PATH);
    this.load.image(WATER_SURFACE_TEXTURE_KEY, WATER_SURFACE_TEXTURE_PATH);
    Object.values(AUDIO.files).forEach(({ key, path }) => this.load.audio(key, path));
    this.load.audio(AUDIO.ambientKey, AUDIO.ambientPath);
  }

  create() {
    this.fruits = new Map();
    this.dangerSince = new Map();
    this.touchingSurface = new Set();
    this.pendingMerges = [];
    this.boundBodies = [];
    this.seabed = null;
    this.gameOverLineY = gameHeight * GAMEPLAY.gameOverFallbackRatio;
    this.gameOverDebugGraphics = null;
    this.gameOverDebugLabel = null;
    this.unlockedLevels = new Set([0]);
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
    this.soundEnabled = readSoundEnabled();
    this.ambientEnabled = readAmbientEnabled();
    this.recordSoundPlayed = false;
    this.gameOverSoundPlayed = false;

    this.time.paused = false;
    this.matter.world.resume();
    this.initializeSounds();
    this.installAudioUnlock();
    FRUITS.forEach((config) => {
      if (this.textures.exists(config.textureKey)) {
        this.textures.get(config.textureKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    });
    if (this.textures.exists(PROGRESS_UI.lockedTextureKey)) {
      this.textures.get(PROGRESS_UI.lockedTextureKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
    } else {
      this.warnProgressAssetOnce(
        PROGRESS_UI.lockedTextureKey,
        `Не удалось загрузить ${PROGRESS_UI.lockedTexturePath}. Используется запасной тёмно-синий круг со знаком вопроса.`,
      );
    }
    this.resetInterface();
    this.createBackdrop();
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
    if (!this.ambientSound && this.cache.audio.exists(AUDIO.ambientKey)) {
      this.ambientSound = this.sound.add(AUDIO.ambientKey, {
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
    if (!this.soundEnabled) return false;
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
    ui.soundToggleButton.setAttribute('aria-label', isEnabled ? 'Выключить звук' : 'Включить звук');
    ui.soundToggleText.textContent = isEnabled ? 'Звук включён' : 'Звук выключен';
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
    ui.ambientToggleButton.setAttribute('aria-label', isEnabled ? 'Выключить атмосферу' : 'Включить атмосферу');
    ui.ambientToggleText.textContent = isEnabled ? 'Звук окружения ВКЛ' : 'Звук окружения ВЫКЛ';
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
    slot.setAttribute('aria-label', `Уровень ${config.level} ${isUnlocked ? 'открыт' : 'закрыт'}`);

    let visual;
    if (isUnlocked && this.textures.exists(config.textureKey)) {
      visual = this.createProgressImage(
        config.texturePath,
        `Открытая рыба уровня ${config.level}`,
        config.progressScale ?? 1,
        config,
      );
      visual.addEventListener('error', () => {
        this.warnProgressAssetOnce(config.textureKey, `Не удалось показать ${config.texturePath}. Для уровня ${config.level} используется цветной круг.`);
        visual.replaceWith(this.createProgressFallback(config, false));
      }, { once: true });
    } else if (!isUnlocked && this.textures.exists(PROGRESS_UI.lockedTextureKey)) {
      visual = this.createProgressImage(
        PROGRESS_UI.lockedTexturePath,
        `Закрытая рыба уровня ${config.level}`,
        PROGRESS_UI.lockedFishScale,
      );
      visual.addEventListener('error', () => {
        this.warnProgressAssetOnce(PROGRESS_UI.lockedTextureKey, `Не удалось показать ${PROGRESS_UI.lockedTexturePath}. Используется запасной тёмно-синий круг со знаком вопроса.`);
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

  // ======================== Служебные QA-сценарии ========================

  setupMaxMergeQa() {
    this.unlockAllLevelsForQa();
    this.time.delayedCall(QA_CONFIG.setupDelay, () => {
      const left = this.createFruit(GAME_WIDTH / 2 - QA_CONFIG.mergeOffsetX, QA_CONFIG.mergeY, MAX_LEVEL_INDEX);
      const right = this.createFruit(GAME_WIDTH / 2 + QA_CONFIG.mergeOffsetX, QA_CONFIG.mergeY, MAX_LEVEL_INDEX);
      left.physics.setVelocity(QA_CONFIG.mergeVelocityX, QA_CONFIG.mergeVelocityY);
      right.physics.setVelocity(-QA_CONFIG.mergeVelocityX, QA_CONFIG.mergeVelocityY);
    });
  }

  setupCreateMaxLevelQa() {
    const sourceLevel = MAX_LEVEL_INDEX - 1;
    this.unlockedLevels = new Set(FRUITS.slice(0, MAX_LEVEL_INDEX).map((_, index) => index));
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
    if (this.textures.exists(WATER_SURFACE_TEXTURE_KEY)) {
      this.textures.get(WATER_SURFACE_TEXTURE_KEY).setFilter(Phaser.Textures.FilterMode.LINEAR);
      const waterSurface = this.add
        .image(GAME_WIDTH / 2, SURFACE_Y, WATER_SURFACE_TEXTURE_KEY)
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
    if (this.textures.exists(SEABED_TEXTURE_KEY)) {
      this.seabed = this.add
        .image(GAME_WIDTH / 2, gameHeight, SEABED_TEXTURE_KEY)
        .setOrigin(BACKDROP_CONFIG.seabedOriginX, BACKDROP_CONFIG.seabedOriginY)
        .setDepth(BACKDROP_CONFIG.seabedDepth);
      this.seabed.setScale(GAME_WIDTH / this.seabed.width);
    }

    // Graphics создаётся один раз; дальше линия только перерисовывается и меняет видимость.
    this.guide = this.add.graphics().setDepth(GUIDE_CONFIG.depth).setVisible(false);
    this.recalculateGameOverLine();
    this.createGameOverDebugLine();
  }

  recalculateGameOverLine() {
    if (this.seabed?.active && this.seabed.displayHeight > 0) {
      const seabedDisplayHeight = this.seabed.displayHeight;
      const seabedTopY = this.seabed.y - seabedDisplayHeight * this.seabed.originY;
      this.gameOverLineY = seabedTopY + seabedDisplayHeight * GAMEPLAY.gameOverSeabedRatio;
    } else {
      this.gameOverLineY = gameHeight * GAMEPLAY.gameOverFallbackRatio;
      if (!warnedMissingSeabedForGameOver) {
        warnedMissingSeabedForGameOver = true;
        console.warn('[Game Over] Изображение морского дна недоступно. Используется резервная граница на 82,5% высоты поля.');
      }
    }

    this.drawGameOverDebugLine();
  }

  createGameOverDebugLine() {
    if (!DEBUG_GAME_OVER_LINE) return;
    this.gameOverDebugGraphics = this.add.graphics().setDepth(DEBUG_VIEW_CONFIG.depth);
    this.gameOverDebugLabel = this.add.text(
      DEBUG_VIEW_CONFIG.labelX,
      this.gameOverLineY - DEBUG_VIEW_CONFIG.labelCreateOffsetY,
      'GAME OVER LIMIT',
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

  createFruit(x, y, level, isHeld = false) {
    const config = FRUITS[level];

    // visual и label не участвуют в физике: позже visual можно заменить изображением рыбки.
    const hasTexture = this.textures.exists(config.textureKey);
    let visual;
    let shine = null;
    let label = null;
    let baseVisualScale = 1;

    if (hasTexture) {
      visual = this.add.image(x, y, config.textureKey)
        .setOrigin(config.originX, config.originY)
        .setDepth(FISH_VISUAL_CONFIG.imageDepth);
      // Основное тело занимает bodyRatio ширины PNG; хвост остаётся вне коллайдера.
      const targetImageWidth = (config.radius * 2) / config.bodyRatio;
      baseVisualScale = targetImageWidth / visual.width;
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
      usesTexture: hasTexture,
      physics: null,
      level,
      isHeld,
      merging: false,
      removed: false,
      bornAt: this.time.now,
      wobbleSeed: Math.random() * NUMBER_FORMAT_CONFIG.fullCircle,
      lastBubbleAt: this.time.now + Phaser.Math.Between(0, FISH_VISUAL_CONFIG.initialBubbleDelayMax),
    };
    if (!isHeld) this.activateFruitPhysics(fruit);
    return fruit;
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
    const isMaxLevelMerge = first.level === MAX_LEVEL_INDEX;
    const gainedPoints = isMaxLevelMerge
      ? GAMEPLAY.maxLevelMergeScore
      : FRUITS[first.level + 1].points;
    const effectColor = isMaxLevelMerge ? FRUITS[first.level].color : FRUITS[first.level + 1].color;

    this.playSound(isMaxLevelMerge ? 'maxMerge' : 'merge');

    this.removeFruit(first);
    this.removeFruit(second);

    this.score += gainedPoints;
    ui.score.textContent = this.score.toLocaleString('ru-RU');
    const hasBrokenRecord = !this.recordSoundPlayed && this.score > this.bestScore;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      saveBestScore(this.bestScore);
      ui.hudBestScore.textContent = this.bestScore.toLocaleString('ru-RU');
      ui.bestScore.textContent = this.bestScore.toLocaleString('ru-RU');
    }
    if (hasBrokenRecord) {
      this.recordSoundPlayed = true;
      this.playSound('record');
    }
    this.addMergeEffects(x, y, effectColor, gainedPoints);

    // Две рыбы максимального уровня поглощаются без создания уровня 7.
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

    this.unlockLevel(newLevel);
  }

  // ======================== Эффекты ========================

  addMergeEffects(x, y, color, points) {
    const ring = this.add.circle(x, y, EFFECTS_CONFIG.ringRadius, 0xffffff, 0)
      .setStrokeStyle(EFFECTS_CONFIG.ringStrokeWidth, EFFECTS_CONFIG.ringColor, EFFECTS_CONFIG.ringAlpha)
      .setDepth(EFFECTS_CONFIG.ringDepth);
    this.tweens.add({
      targets: ring,
      scale: EFFECTS_CONFIG.ringEndScale,
      alpha: 0,
      duration: EFFECTS_CONFIG.ringDuration,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });

    for (let index = 0; index < EFFECTS_CONFIG.mergeBubbleCount; index += 1) {
      const angle = (NUMBER_FORMAT_CONFIG.fullCircle * index) / EFFECTS_CONFIG.mergeBubbleCount;
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

    const pointsText = this.add.text(x, y - EFFECTS_CONFIG.pointsOffsetY, `+${points}`, {
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
  }

  // ======================== Физика и игровой цикл ========================

  removeFruit(fruit) {
    if (!fruit?.physics?.body || fruit.removed) return;
    fruit.removed = true;
    const bodyId = fruit.physics.body.id;
    this.fruits.delete(bodyId);
    this.dangerSince.delete(bodyId);
    this.touchingSurface.delete(bodyId);
    fruit.label?.destroy();
    fruit.shine?.destroy();
    fruit.visual.destroy();
    fruit.physics.destroy();
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
    ui.nextFish.setAttribute('aria-label', `Следующая рыбка: уровень ${next.level}`);
  }

  setPaused(value) {
    if (this.gameEnded || this.isPaused === value) return;
    if (value) this.cancelCurrentFruitDrag();
    this.isPaused = value;
    ui.pauseModal.hidden = !value;
    ui.pauseButton.setAttribute('aria-label', value ? 'Продолжить игру' : 'Пауза');
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
    this.startAmbient();
  }

  endGame() {
    if (this.gameEnded) return;
    this.gameEnded = true;
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

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      saveBestScore(this.bestScore);
    }
    ui.finalScore.textContent = this.score.toLocaleString('ru-RU');
    ui.bestScore.textContent = this.bestScore.toLocaleString('ru-RU');
    ui.gameOver.hidden = false;
  }

  resetInterface() {
    ui.score.textContent = '0';
    ui.hudBestScore.textContent = this.bestScore.toLocaleString('ru-RU');
    ui.finalScore.textContent = '0';
    ui.bestScore.textContent = this.bestScore.toLocaleString('ru-RU');
    ui.pauseButton.setAttribute('aria-label', 'Пауза');
    ui.controlHint.classList.toggle('is-hidden', hasCompletedFirstDrop);
    ui.controlHint.setAttribute('aria-hidden', String(hasCompletedFirstDrop));
    ui.warning.classList.remove('is-visible');
    ui.gameWrap.classList.remove('is-danger');
    ui.pauseModal.hidden = true;
    ui.gameOver.hidden = true;
    this.updateSoundToggleInterface();
    this.updateAmbientToggleInterface();
    this.renderProgression();
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
  scene.time.paused = false;
  scene.matter.world.resume();
  ui.pauseModal.hidden = true;
  ui.gameOver.hidden = true;
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
ui.pauseRestartButton.addEventListener('click', restartGame);
ui.restartButton.addEventListener('click', restartGame);

// Небольшой публичный объект помогает проверять состояние прототипа в консоли.
window.fuguGame = game;
