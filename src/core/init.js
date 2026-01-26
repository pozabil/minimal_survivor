import { createPlayer } from "./player.js";
import { createEntities, createSpawn, createState, createUiState } from "./state.js";

export function initState() {
  return {
    player: createPlayer(),
    entities: createEntities(),
    spawn: createSpawn(),
    state: createState(),
    ui: createUiState(),
  };
}
