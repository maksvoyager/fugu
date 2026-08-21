// Эти параметры относятся только к миниатюрам нижней панели.
export const PROGRESS_UI = {
  progressFishSize: 48,
  lockedFishScale: 0.94,
};

export const STARTING_LEVELS = 1;

// ---------- Баланс, вода и Game Over ----------
export const GAMEPLAY = {
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
};
