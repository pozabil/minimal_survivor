import { createState, createUiState } from "./state.js";

export function initState() {
  return {
    state: createState(),
    ui: createUiState(),
  };
}
