export function createRunHandlers({
  resetState,
  player,
  pF,
  sceneManager,
  maybeAddStartingDog,
  getPlayerClass,
}) {
  function handleSelectHero(hero) {
    hero.apply(player);
    maybeAddStartingDog({ hero, pF });
  }

  function handleSelectLevel(levelId) {
    sceneManager.setScene(levelId);
  }

  function startRun(levelId, hero) {
    resetState();
    handleSelectHero(hero);
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
