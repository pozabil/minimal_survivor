import { freeGame } from "../scenes/free_game.js";

export function registerScenes(sceneManager, pipeline, main, extra) {
  freeGame.register(sceneManager, pipeline);
}
