import {
  MAX_SHIRT_SLOW_DURATION,
  MAX_SHIRT_COOLDOWN,
  MAX_SHIRT_KILL_CD_REDUCE,
} from "../../content/uniques.js";

export function createMaxShirtSystem({ state, pF }) {
  function tryActivateMaxShirt() {
    if (!pF.hasUnique("max_shirt")) return false;
    if (state.maxShirtCd > 0 || state.maxShirtSlowT > 0) return false;
    state.maxShirtSlowT = MAX_SHIRT_SLOW_DURATION;
    state.maxShirtCd = MAX_SHIRT_COOLDOWN;
    return true;
  }

  function onEnemyKill() {
    if (!pF.hasUnique("max_shirt")) return;
    if (state.maxShirtCd <= 0) return;
    state.maxShirtCd = Math.max(0, state.maxShirtCd - MAX_SHIRT_KILL_CD_REDUCE);
  }

  function updateMaxShirt(dt) {
    if (!pF.hasUnique("max_shirt")) return;
    if (state.maxShirtSlowT > 0) {
      state.maxShirtSlowT = Math.max(0, state.maxShirtSlowT - dt);
    }
    if (state.maxShirtCd > 0) {
      state.maxShirtCd = Math.max(0, state.maxShirtCd - dt);
    }
  }

  return {
    tryActivateMaxShirt,
    onEnemyKill,
    updateMaxShirt,
  };
}
