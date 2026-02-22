import { getProgressionLevel } from "../content/progression_levels.js";
import { markLevelCompleted } from "../systems/storage.js";

const LEVEL_ID = "level1";

export const level1 = {
  register(sceneManager, pipeline, main) {
    const { update, rUpdate, render } = pipeline;
    const { menus, state } = main;
    const level = getProgressionLevel(LEVEL_ID);
    const completeAtSeconds = 60;
    const levelName = level ? level.name : "Уровень 1";

    let done = false;

    function completeLevel() {
      if (done) return;
      done = true;
      markLevelCompleted(LEVEL_ID);
      sceneManager.setScene("mainMenu");
      menus.setMainMenuNotice(`${levelName} пройден`);
    }

    sceneManager.register(LEVEL_ID, {
      enter() {
        done = false;
        menus.enterGameplayUi();
      },
      update(dt) {
        update(dt);
        if (!state.dead && state.t >= completeAtSeconds) completeLevel();
      },
      rUpdate(dtRaw) {
        rUpdate(dtRaw);
      },
      render() {
        render();
      },
      exit() {},
    });
  },
};
