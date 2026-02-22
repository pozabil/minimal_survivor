import { getProgressionLevel } from "../content/levels.js";
import { markLevelCompleted } from "../systems/storage.js";

const LEVEL_ID = "laa";

export const laa = {
  register(sceneManager, pipeline, main) {
    const { update, rUpdate, render } = pipeline;
    const { menus, state } = main;
    const level = getProgressionLevel(LEVEL_ID);
    const completeAtSeconds = level.completeAtSeconds;
    const levelName = level.name;

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
