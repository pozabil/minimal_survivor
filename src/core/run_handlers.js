import { getProgressionLevel } from "../content/levels.js";

export function createRunHandlers({
  resetState,
  state,
  player,
  pF,
  sceneManager,
  maybeAddStartingDog,
  getPlayerClass,
}) {
  function handleSelectHero(hero) {
    hero.apply(player);
  }

  function handleSelectLevel(levelId) {
    sceneManager.setScene(levelId);
  }

  function startRun(levelId, hero) {
    resetState();
    const level = getProgressionLevel(levelId);
    state.allowBossSpawns = level ? (level.allowBossSpawns !== false) : true;
    state.allowTotemSpawns = level ? (level.allowTotemSpawns !== false) : true;
    handleSelectHero(hero);
    if (levelId === "freeGame") maybeAddStartingDog({ hero, pF });
    handleSelectLevel(levelId);
  }

  function handleResetGame() {
    const levelId = sceneManager.getCurrentSceneId();
    const hero = getPlayerClass(player.heroId) || getPlayerClass("scout");
    startRun(levelId, hero);
  }

  return {
    startRun,
    handleSelectHero,
    handleSelectLevel,
    handleResetGame,
  };
}
