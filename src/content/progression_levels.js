export const PROGRESSION_LEVELS = [
  {
    id: "level1",
    name: "Уровень 1",
    objectiveText: "Выжить 1 минуту",
  },
];

export function getProgressionLevel(levelId) {
  return PROGRESSION_LEVELS.find((level) => level.id === levelId) || null;
}
