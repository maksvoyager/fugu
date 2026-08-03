// Единая конфигурация всех уровней. Длина массива определяет их количество в игре.
// color отвечает за вид круга, radius — за отдельный круглый Matter-коллайдер.
export const FRUITS = [
  { level: 1, name: 'Фугу 1', radius: 25, color: 0xff5f9e, cssColor: '#ff5f9e', points: 10, textureKey: 'fish-level-1', texturePath: './assets/fish/level1.png', bodyRatio: 0.71, originX: 0.532, originY: 0.488, progressScale: 0.98 },
  { level: 2, name: 'Фугу 2', radius: 33, color: 0xff9e3d, cssColor: '#ff9e3d', points: 25, textureKey: 'fish-level-2', texturePath: './assets/fish/level2.png', bodyRatio: 0.72, originX: 0.518, originY: 0.489, progressScale: 1.02 },
  { level: 3, name: 'Фугу 3', radius: 42, color: 0xffd84a, cssColor: '#ffd84a', points: 50, textureKey: 'fish-level-3', texturePath: './assets/fish/level3.png', bodyRatio: 0.68, originX: 0.522, originY: 0.488, progressScale: 0.93 },
  { level: 4, name: 'Фугу 4', radius: 53, color: 0x55cf86, cssColor: '#55cf86', points: 100, textureKey: 'fish-level-4', texturePath: './assets/fish/level4.png', bodyRatio: 0.71, originX: 0.513, originY: 0.496, progressScale: 0.97 },
  { level: 5, name: 'Фугу 5', radius: 66, color: 0x48c5ed, cssColor: '#48c5ed', points: 200, textureKey: 'fish-level-5', texturePath: './assets/fish/level5.png', bodyRatio: 0.70, originX: 0.513, originY: 0.479, progressScale: 1 },
  { level: 6, name: 'Фугу 6', radius: 81, color: 0x9a76ed, cssColor: '#9a76ed', points: 400, textureKey: 'fish-level-6', texturePath: './assets/fish/level6.png', bodyRatio: 0.70, originX: 0.527, originY: 0.496, progressScale: 0.99 },
  { level: 7, name: 'Фугу 7', radius: 98, color: 0xf04a3e, cssColor: '#f04a3e', points: 800, textureKey: 'fish-level-7', texturePath: './assets/fish/level7.png', bodyRatio: 0.78, originX: 0.508, originY: 0.493, progressScale: 0.94 },
  { level: 8, name: 'Фугу 8', radius: 117, color: 0x263b62, cssColor: '#263b62', points: 1600, textureKey: 'fish-level-8', texturePath: './assets/fish/level8.png', bodyRatio: 0.78, originX: 0.514, originY: 0.496, progressScale: 0.96 },
];

// Эти параметры относятся только к миниатюрам нижней панели.
export const PROGRESS_UI = {
  progressFishSize: 48,
  lockedFishScale: 0.94,
  lockedTextureKey: 'fish-locked',
  lockedTexturePath: './assets/fish/locked_fish.png',
};

export const STARTING_LEVELS = 1;

// ---------- Баланс, вода и Game Over ----------
export const GAMEPLAY = {
  // Очки и максимальный уровень.
  maxLevelMergeScore: 3200,

  // Скорость и сопротивление воды.
  riseSpeedMultiplier: 1.5,
  buoyancyForce: -0.000264,
  surfaceFadeDistance: 110,
  waterDrag: 0.045,
  maxRiseSpeed: 5.28,
  angularDamping: 0.985,

  // Появление следующей рыбы.
  spawnDelay: 620,

  // Условия переполнения поля.
  dangerDelay: 2600,
  dangerStabilizationDelay: 850,
  dangerStableSpeed: 0.65,
  gameOverSeabedRatio: 0.5,
  gameOverFallbackRatio: 0.825,
};
