import { createPlayer } from "./player.js";
import { createEffects, createEntities, createSpawn, createState, createUiState } from "./state.js";
import { syncObject } from "../utils/sync.js";

function toResetHooks(onReset) {
  if (!onReset) return [];
  return Array.isArray(onReset) ? onReset : [onReset];
}

export function createResetState({ player, state, ui, entities, spawn, effects, onReset = [] }) {
  const resetHooks = toResetHooks(onReset);

  return function resetState() {
    const defaults = {
      player: createPlayer(),
      state: createState(),
      ui: createUiState(),
      entities: createEntities(),
      spawn: createSpawn(),
      effects: createEffects(),
    };

    syncObject(player, defaults.player);
    syncObject(state, defaults.state);
    syncObject(ui, defaults.ui);
    syncObject(entities, defaults.entities);
    syncObject(spawn, defaults.spawn);
    syncObject(effects, defaults.effects);
    for (const hook of resetHooks) hook();
  };
}
