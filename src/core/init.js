import { createPlayer } from "./player.js";
import { createEffects, createEntities, createSpawn, createState, createUiState } from "./state.js";

export function initState() {
  return {
    player: createPlayer(),
    state: createState(),
    ui: createUiState(),
    entities: createEntities(),
    spawn: createSpawn(),
    effects: createEffects(),
  };
}
