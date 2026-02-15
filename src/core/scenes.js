import { mainMenu } from "../scenes/main_menu.js";
import { freeGame } from "../scenes/free_game.js";

export function registerScenes(sceneManager, pipeline, main, extra) {
  mainMenu.register(sceneManager, main);
  freeGame.register(sceneManager, pipeline);
}
