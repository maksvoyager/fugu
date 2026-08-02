import { FRUITS, STARTING_LEVELS, GAMEPLAY, PROGRESS_UI } from './fruits.js';

const Phaser = window.Phaser;
const GAME_WIDTH = 540;
const DESKTOP_GAME_HEIGHT = 960;
const MOBILE_BREAKPOINT = 600;
const MIN_MOBILE_GAME_HEIGHT = 760;
const SPAWN_BOTTOM_OFFSET = 200;
const WALL_SIZE = 28;
const SURFACE_Y = 104;
const SEABED_TEXTURE_KEY = 'bottom-seabed';
const SEABED_TEXTURE_PATH = 'assets/backgrounds/bottom_seabed.png';
const BEST_SCORE_KEY = 'fugu-merge-best-score';
const URL_OPTIONS = new URLSearchParams(window.location.search);
const DEBUG_PHYSICS = URL_OPTIONS.has('debugPhysics');
const QA_MAX_MERGE = URL_OPTIONS.has('qaMaxMerge');
const QA_CREATE_MAX_LEVEL = URL_OPTIONS.has('qaCreateMaxLevel');
const QA_PHYSICS_PILE = URL_OPTIONS.has('qaPhysicsPile');
const QA_GAME_OVER = URL_OPTIONS.has('qaGameOver');
const QA_PROGRESSION = URL_OPTIONS.has('qaProgression');
const QA_NEXT_LEVEL = Number.parseInt(URL_OPTIONS.get('qaNextLevel') || '', 10) - 1;
const QA_NEXT_PREVIEW_LEVEL = Number.parseInt(URL_OPTIONS.get('qaNextPreview') || '', 10) - 1;
const DEBUG_GAME_OVER_LINE = URL_OPTIONS.has('debugGameOverLine');
const MAX_LEVEL_INDEX = FRUITS.length - 1;

function viewportSize() {
  const viewport = window.visualViewport;
  return {
    width: Math.max(1, viewport?.width || window.innerWidth),
    height: Math.max(1, viewport?.height || window.innerHeight),
  };
}

function calculateGameHeight() {
  const { width, height } = viewportSize();
  if (width > MOBILE_BREAKPOINT) return DESKTOP_GAME_HEIGHT;
  return Math.max(MIN_MOBILE_GAME_HEIGHT, Math.round((GAME_WIDTH * height) / width));
}

let gameHeight = calculateGameHeight();
const spawnY = () => gameHeight - SPAWN_BOTTOM_OFFSET;

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
  nextFish: document.querySelector('#next-fruit'),
  warning: document.querySelector('#warning'),
  pauseButton: document.querySelector('#pause-button'),
  pauseModal: document.querySelector('#pause-modal'),
  continueButton: document.querySelector('#continue-button'),
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

class FruitScene extends Phaser.Scene {
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
    this.gameEnded = false;
    this.isPaused = false;
  }

  preload() {
    // Все изображения из единой конфигурации загружаются заранее; при ошибке используется fallback-круг.
    FRUITS.forEach((config) => this.load.image(config.textureKey, config.texturePath));
    // Универсальная закрытая рыба загружается один раз и переиспользуется во всех слотах.
    this.load.image(PROGRESS_UI.lockedTextureKey, PROGRESS_UI.lockedTexturePath);
    this.load.image(SEABED_TEXTURE_KEY, SEABED_TEXTURE_PATH);
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
    this.gameEnded = false;
    this.isPaused = false;

    this.time.paused = false;
    this.matter.world.resume();
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
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleGameResize, this);
    });
    this.createInvisibleBounds();

    this.matter.world.engine.positionIterations = 8;
    this.matter.world.engine.velocityIterations = 6;
    this.matter.world.on('collisionstart', this.handleCollisions, this);
    this.matter.world.on('collisionend', this.handleCollisionEnd, this);
    this.input.on('pointermove', this.moveCurrentFruit, this);
    this.input.on('pointerdown', this.dropCurrentFruit, this);

    this.nextLevel = Number.isInteger(QA_NEXT_LEVEL) && QA_NEXT_LEVEL >= 0 && QA_NEXT_LEVEL < FRUITS.length
      ? QA_NEXT_LEVEL
      : this.randomStartingLevel();
    this.updateNextPreview();
    this.time.delayedCall(300, () => this.spawnFruit());
    if (Number.isInteger(QA_NEXT_PREVIEW_LEVEL) && QA_NEXT_PREVIEW_LEVEL >= 0 && QA_NEXT_PREVIEW_LEVEL < FRUITS.length) {
      this.time.delayedCall(450, () => {
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
      image.style.setProperty('--progress-offset-x', `${(0.5 - config.originX) * 100}%`);
      image.style.setProperty('--progress-offset-y', `${(0.5 - config.originY) * 100}%`);
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
      window.setTimeout(() => slot.classList.remove('just-unlocked'), 650);
    }
  }

  renderProgression() {
    ui.progression.style.setProperty('--progress-fish-size', `${PROGRESS_UI.progressFishSize}px`);
    ui.progressSlots.forEach((_, index) => this.renderProgressSlot(index));
  }

  setupMaxMergeQa() {
    this.unlockAllLevelsForQa();
    this.time.delayedCall(120, () => {
      const left = this.createFruit(GAME_WIDTH / 2 - 62, 410, MAX_LEVEL_INDEX);
      const right = this.createFruit(GAME_WIDTH / 2 + 62, 410, MAX_LEVEL_INDEX);
      left.physics.setVelocity(0.25, -0.2);
      right.physics.setVelocity(-0.25, -0.2);
    });
  }

  setupCreateMaxLevelQa() {
    const sourceLevel = MAX_LEVEL_INDEX - 1;
    this.unlockedLevels = new Set(FRUITS.slice(0, MAX_LEVEL_INDEX).map((_, index) => index));
    this.renderProgression();
    this.time.delayedCall(120, () => {
      const left = this.createFruit(GAME_WIDTH / 2 - 62, 410, sourceLevel);
      const right = this.createFruit(GAME_WIDTH / 2 + 62, 410, sourceLevel);
      left.physics.setVelocity(0.25, -0.2);
      right.physics.setVelocity(-0.25, -0.2);
    });
  }

  setupPhysicsPileQa() {
    this.unlockAllLevelsForQa();
    const layout = [
      [0, 100, 235], [1, 170, 255], [2, 245, 250],
      [3, 335, 255], [4, 430, 245], [5, 275, 390],
    ];
    this.time.delayedCall(120, () => {
      layout.forEach(([level, x, y]) => {
        const fruit = this.createFruit(x, y, level);
        fruit.bornAt = Number.POSITIVE_INFINITY;
      });
    });
  }

  setupGameOverQa() {
    this.time.delayedCall(120, () => {
      const level = 2;
      const radius = FRUITS[level].radius;
      const fruit = this.createFruit(GAME_WIDTH / 2, this.gameOverLineY - radius + 5, level);
      fruit.bornAt = this.time.now - GAMEPLAY.dangerStabilizationDelay;
      fruit.physics.setStatic(true);
    });
  }

  setupProgressionQa() {
    // Служебный сценарий последовательно показывает открытие всех уровней из конфигурации.
    FRUITS.slice(1).forEach((_, index) => {
      this.time.delayedCall(700 + index * 650, () => this.unlockLevel(index + 1));
    });
  }

  createBackdrop() {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    const graphics = this.add.graphics().setDepth(0);

    // Мягкая светлая поверхность воды. Это только декор, коллайдер расположен отдельно.
    graphics.lineStyle(5, 0xe8fdff, 0.92);
    graphics.beginPath();
    graphics.moveTo(0, SURFACE_Y);
    for (let x = 0; x <= GAME_WIDTH; x += 15) {
      graphics.lineTo(x, SURFACE_Y + Math.sin(x * 0.055) * 5 + Math.sin(x * 0.12) * 2);
    }
    graphics.strokePath();

    graphics.lineStyle(2, 0xffffff, 0.22);
    [[68, 330, 7], [462, 405, 5], [102, 615, 4], [434, 690, 8], [160, 770, 5], [382, 525, 3]].forEach(([x, y, r]) => {
      graphics.strokeCircle(x, y, r);
    });

    // Готовое изображение дна: масштабируется по ширине без искажения
    // и остаётся чисто декоративным (без физического тела Matter.js).
    if (this.textures.exists(SEABED_TEXTURE_KEY)) {
      this.seabed = this.add
        .image(GAME_WIDTH / 2, gameHeight, SEABED_TEXTURE_KEY)
        .setOrigin(0.5, 1)
        .setDepth(0.5);
      this.seabed.setScale(GAME_WIDTH / this.seabed.width);
    }

    this.guide = this.add.graphics().setDepth(1);
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
    this.gameOverDebugGraphics = this.add.graphics().setDepth(30);
    this.gameOverDebugLabel = this.add.text(12, this.gameOverLineY - 24, 'GAME OVER LIMIT', {
      fontFamily: 'Nunito, sans-serif',
      fontSize: '15px',
      fontStyle: '900',
      color: '#ffedf0',
      backgroundColor: 'rgba(128, 0, 28, 0.72)',
      padding: { x: 7, y: 4 },
    }).setDepth(31);
    this.drawGameOverDebugLine();
  }

  drawGameOverDebugLine() {
    if (!DEBUG_GAME_OVER_LINE || !this.gameOverDebugGraphics || !this.gameOverDebugLabel) return;
    this.gameOverDebugGraphics.clear();
    this.gameOverDebugGraphics.lineStyle(2, 0xff4968, 0.95);
    this.gameOverDebugGraphics.lineBetween(0, this.gameOverLineY, GAME_WIDTH, this.gameOverLineY);
    this.gameOverDebugLabel.setPosition(12, this.gameOverLineY - 27);
  }

  createInvisibleBounds() {
    this.boundBodies.forEach((body) => this.matter.world.remove(body));
    const sideOptions = { isStatic: true, friction: 0.08, frictionStatic: 0.05, restitution: 0.02, label: 'wall' };
    const surfaceOptions = { isStatic: true, friction: 0.08, frictionStatic: 0.04, restitution: 0, label: 'surface' };
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
      this.currentFruit.visual.setPosition(x, spawnY());
      this.currentFruit.label?.setPosition(x, spawnY());
      this.currentFruit.shine?.setPosition(x - radius * 0.28, spawnY() - radius * 0.3);
      this.drawGuide(x, radius);
    }

    this.recalculateGameOverLine();
  }

  randomStartingLevel() {
    const availableLevels = Math.min(STARTING_LEVELS + this.unlockedLevels.size - 1, 3);
    return Phaser.Math.Between(0, availableLevels - 1);
  }

  spawnFruit() {
    if (this.gameEnded || this.isPaused) return;
    const level = this.nextLevel;
    this.nextLevel = this.randomStartingLevel();
    this.updateNextPreview();
    this.currentFruit = this.createFruit(GAME_WIDTH / 2, spawnY(), level, true);
    this.canDrop = true;
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
        .setDepth(4);
      // Основное тело занимает bodyRatio ширины PNG; хвост остаётся вне коллайдера.
      const targetImageWidth = (config.radius * 2) / config.bodyRatio;
      baseVisualScale = targetImageWidth / visual.width;
      visual.setScale(baseVisualScale);
    } else {
      visual = this.add.circle(x, y, config.radius, config.color)
        .setStrokeStyle(4, 0xffffff, 0.58)
        .setDepth(3);
      shine = this.add.ellipse(x - config.radius * 0.28, y - config.radius * 0.3,
        config.radius * 0.42, config.radius * 0.2, 0xffffff, 0.48).setDepth(4);
      label = this.add.text(x, y, String(config.level), {
        fontFamily: 'Nunito, sans-serif',
        fontSize: `${Math.max(24, config.radius * 0.78)}px`,
        fontStyle: '900',
        color: '#ffffff',
        shadow: { offsetX: 0, offsetY: 3, color: '#00699d', blur: 5, fill: true },
      }).setOrigin(0.5).setDepth(5);
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
      wobbleSeed: Math.random() * Math.PI * 2,
      lastBubbleAt: this.time.now + Phaser.Math.Between(0, 300),
    };
    if (!isHeld) this.activateFruitPhysics(fruit);
    return fruit;
  }

  activateFruitPhysics(fruit) {
    const config = FRUITS[fruit.level];
    const collider = this.add.circle(fruit.visual.x, fruit.visual.y, config.radius, 0xffffff, 0).setDepth(2);

    this.matter.add.gameObject(collider, {
      shape: { type: 'circle', radius: config.radius },
      restitution: 0.02,
      friction: 0.08,
      frictionStatic: 0.05,
      frictionAir: GAMEPLAY.waterDrag,
      density: 0.0018,
      label: `fish-${fruit.level}`,
    });

    fruit.physics = collider;
    fruit.isHeld = false;
    fruit.bornAt = this.time.now;
    collider.body.fruitData = fruit;
    this.fruits.set(collider.body.id, fruit);
  }

  syncFruitVisual(fruit, time) {
    const motionFactor = Phaser.Math.Clamp(fruit.physics.body.speed / 1.4, 0, 1);
    const contactFactor = this.touchingSurface.has(fruit.physics.body.id) ? 0 : 1;
    const wobble = Math.sin(time * 0.0022 + fruit.wobbleSeed) * 0.025 * motionFactor * contactFactor;
    const x = fruit.physics.x;
    const y = fruit.physics.y;
    const rotation = fruit.physics.rotation + wobble;
    const radius = FRUITS[fruit.level].radius;

    fruit.visual.setPosition(x, y).setRotation(rotation);
    fruit.label?.setPosition(x, y).setRotation(rotation * 0.25);
    fruit.shine?.setPosition(x - radius * 0.28, y - radius * 0.3).setRotation(rotation);
  }

  moveCurrentFruit(pointer) {
    if (!this.currentFruit || !this.canDrop || this.gameEnded || this.isPaused) return;
    const radius = FRUITS[this.currentFruit.level].radius;
    const x = Phaser.Math.Clamp(pointer.worldX, WALL_SIZE + radius, GAME_WIDTH - WALL_SIZE - radius);
    this.currentFruit.visual.setPosition(x, spawnY());
    this.currentFruit.label?.setPosition(x, spawnY());
    this.currentFruit.shine?.setPosition(x - radius * 0.28, spawnY() - radius * 0.3);
    this.drawGuide(x, radius);
  }

  drawGuide(x, radius) {
    this.guide.clear();
    this.guide.lineStyle(2, 0xffffff, 0.22);
    this.guide.lineBetween(x, spawnY() - radius - 9, x, SURFACE_Y + 26);
  }

  dropCurrentFruit(pointer) {
    if (!this.currentFruit || !this.canDrop || this.gameEnded || this.isPaused) return;
    this.moveCurrentFruit(pointer);
    this.canDrop = false;
    this.guide.clear();
    this.activateFruitPhysics(this.currentFruit);
    this.currentFruit.physics.setVelocity(0, -0.35);
    this.currentFruit = null;
    this.time.delayedCall(GAMEPLAY.spawnDelay, () => this.spawnFruit());
  }

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

    this.removeFruit(first);
    this.removeFruit(second);

    this.score += gainedPoints;
    ui.score.textContent = this.score.toLocaleString('ru-RU');
    this.addMergeEffects(x, y, effectColor, gainedPoints);

    // Две рыбы максимального уровня поглощаются без создания уровня 7.
    if (isMaxLevelMerge) return;

    const newLevel = first.level + 1;
    const merged = this.createFruit(x, y, newLevel);
    merged.physics.setVelocity(velocityX * 0.45, Math.min(velocityY, -0.8));

    // Bounce применяется только к визуалу, круглый физический коллайдер не масштабируется.
    [merged.visual, merged.shine, merged.label].filter(Boolean).forEach((target) => {
      const targetScale = target === merged.visual ? merged.baseVisualScale : 1;
      target.setScale(targetScale * 0.72);
      this.tweens.add({ targets: target, scale: targetScale, duration: 250, ease: 'Back.Out' });
    });

    this.unlockLevel(newLevel);
  }

  addMergeEffects(x, y, color, points) {
    const ring = this.add.circle(x, y, 18, 0xffffff, 0).setStrokeStyle(4, 0xd9faff, 0.85).setDepth(9);
    this.tweens.add({
      targets: ring,
      scale: 3.2,
      alpha: 0,
      duration: 420,
      ease: 'Cubic.Out',
      onComplete: () => ring.destroy(),
    });

    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10;
      const dot = this.add.circle(x, y, Phaser.Math.Between(3, 6), i % 2 ? 0xffffff : color, 0.85).setDepth(10);
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * Phaser.Math.Between(35, 57),
        y: y + Math.sin(angle) * Phaser.Math.Between(35, 57) - 9,
        alpha: 0,
        scale: 0.25,
        duration: Phaser.Math.Between(300, 460),
        ease: 'Cubic.Out',
        onComplete: () => dot.destroy(),
      });
    }

    const pointsText = this.add.text(x, y - 20, `+${points}`, {
      fontFamily: 'Nunito, sans-serif', fontSize: '22px', fontStyle: '900', color: '#ffffff',
      shadow: { offsetX: 0, offsetY: 3, color: '#00639b', blur: 6, fill: true },
    }).setOrigin(0.5).setDepth(11);
    this.tweens.add({ targets: pointsText, y: y - 76, alpha: 0, duration: 650, ease: 'Cubic.Out', onComplete: () => pointsText.destroy() });
  }

  createTrailBubble(fruit) {
    const radius = FRUITS[fruit.level].radius;
    const bubble = this.add.circle(
      fruit.physics.x + Phaser.Math.Between(-Math.floor(radius * 0.25), Math.floor(radius * 0.25)),
      fruit.physics.y + radius * 0.72,
      Phaser.Math.Between(2, 5),
      0xffffff,
      0.4,
    ).setStrokeStyle(1, 0xffffff, 0.5).setDepth(2);
    this.tweens.add({
      targets: bubble,
      y: bubble.y - Phaser.Math.Between(25, 48),
      x: bubble.x + Phaser.Math.Between(-8, 8),
      alpha: 0,
      scale: 0.5,
      duration: Phaser.Math.Between(550, 800),
      onComplete: () => bubble.destroy(),
    });
  }

  unlockLevel(levelIndex) {
    if (this.unlockedLevels.has(levelIndex)) return;
    this.unlockedLevels.add(levelIndex);
    const slot = ui.progressSlots[levelIndex];
    this.renderProgressSlot(levelIndex, true);

    for (let i = 0; i < 5; i += 1) {
      const bubble = document.createElement('i');
      bubble.className = 'unlock-bubble';
      bubble.style.left = `${32 + i * 9}%`;
      bubble.style.bottom = '10%';
      bubble.style.setProperty('--bubble-x', `${(i - 2) * 8}px`);
      slot.appendChild(bubble);
      window.setTimeout(() => bubble.remove(), 750);
    }
  }

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
    const isStableUpperPile = fruit.physics.y < SURFACE_Y + 260 && body.speed < 0.16;
    if (isStableUpperPile) buoyancyFactor = 0;

    if (buoyancyFactor > 0.01) {
      fruit.physics.applyForce({
        x: 0,
        y: GAMEPLAY.buoyancyForce * body.mass * buoyancyFactor,
      });
    }

    // Мягкое затухание вращения без ручного изменения позиции или угла body.
    if (Math.abs(body.angularVelocity) > 0.0005) {
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

      if (fruit.physics.body.velocity.y < -GAMEPLAY.maxRiseSpeed) {
        fruit.physics.setVelocityY(-GAMEPLAY.maxRiseSpeed);
      }
      if (Math.abs(fruit.physics.body.velocity.x) > 3.2) {
        fruit.physics.setVelocityX(Phaser.Math.Clamp(fruit.physics.body.velocity.x, -3.2, 3.2));
      }

      if (fruit.physics.body.velocity.y < -0.45 && time - fruit.lastBubbleAt > 430 + fruit.level * 45) {
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
    }
  }

  endGame() {
    if (this.gameEnded) return;
    this.gameEnded = true;
    this.canDrop = false;
    this.guide.clear();
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
    ui.finalScore.textContent = '0';
    ui.bestScore.textContent = this.bestScore.toLocaleString('ru-RU');
    ui.warning.classList.remove('is-visible');
    ui.gameWrap.classList.remove('is-danger');
    ui.pauseModal.hidden = true;
    ui.gameOver.hidden = true;
    this.renderProgression();
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: gameHeight,
  transparent: true,
  resolution: Math.min(window.devicePixelRatio || 1, 2),
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
  scene.time.paused = false;
  scene.matter.world.resume();
  ui.pauseModal.hidden = true;
  ui.gameOver.hidden = true;
  scene.scene.restart();
}

ui.pauseButton.addEventListener('click', () => {
  const scene = activeScene();
  if (!scene?.scene.isActive()) return;
  scene.setPaused(!scene.isPaused);
});
ui.continueButton.addEventListener('click', () => activeScene().setPaused(false));
ui.pauseRestartButton.addEventListener('click', restartGame);
ui.restartButton.addEventListener('click', restartGame);

// Небольшой публичный объект помогает проверять состояние прототипа в консоли.
window.fuguGame = game;
