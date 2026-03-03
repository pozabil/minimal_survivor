export const LEVELS = [
  {
    id: "laa",
    name: "Уровень 1",
    objectiveText: "Выжить 1 минуту",
    completeAtSeconds: 60,
    allowBossSpawns: false,
    allowTotemSpawns: false,
  },
];

export function getProgressionLevel(levelId) {
  return LEVELS.find((level) => level.id === levelId) || null;
}

export function getNextProgressionLevel(levelId) {
  const idx = LEVELS.findIndex((level) => level.id === levelId);
  if (idx < 0 || idx + 1 >= LEVELS.length) return null;
  return LEVELS[idx + 1];
}
