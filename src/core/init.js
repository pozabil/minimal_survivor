import { createPlayer } from "./player.js";
import { createState, createUiState } from "./state.js";

export function initState() {
  return {
    player: createPlayer(),
    state: createState(),
    ui: createUiState(),
  };
}
