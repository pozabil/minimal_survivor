import { mainMenu } from "../scenes/main_menu.js";
import { freeGame } from "../scenes/free_game.js";
import { level1 } from "../scenes/level_1.js";

export function registerScenes(sceneManager, pipeline, main, extra) {
  mainMenu.register(sceneManager, main);
  freeGame.register(sceneManager, pipeline, main);
  level1.register(sceneManager, pipeline, main, extra);
}
