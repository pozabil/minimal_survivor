import { HEAL_OVER_TIME } from "../content/config.js";
import { circleHit } from "../utils/collision.js";

export function createTryPickupChest({
  chests,
  player,
  state,
  openUpgradePicker,
}) {
  function pickUpChest() {
    if (!chests.length) {
      state.chestAlive = false;
      return;
    }
    const c = chests[0];
    chests.length = 0;
    state.chestAlive = false;
    if (player.chestBonusReroll > 0) {
      player.rerolls = Math.min(player.rerollCap, player.rerolls + player.chestBonusReroll);
    }
    openUpgradePicker(c && c.special ? "unique" : "chest");
  }

  return function tryPickupChest(dt) {
    if (!chests.length) return;
    const c = chests[0];
    c.t += dt;
    if (circleHit(player.x, player.y, player.r, c.x, c.y, c.r)) {
      pickUpChest();
    }
  };
}

export function createProgressionSystem({
  player,
  state,
  pF,
  maybeOpenLevelPicker,
}) {
  function queueHeal(amount) {
    if (amount <= 0) return;
    if (player.hp >= player.hpMax) return;
    state.healQueue.push({ amount, t: 0 });
  }

  function updateHeal(dt) {
    if (player.hp >= player.hpMax) {
      state.healActive = null;
      state.healQueue.length = 0;
      return;
    }
    if (!state.healActive && state.healQueue.length) {
      state.healActive = state.healQueue.shift();
    }
    const h = state.healActive;
    if (!h) return;
    const step = Math.min(dt, HEAL_OVER_TIME - h.t);
    if (step > 0) {
      player.hp = Math.min(player.hpMax, player.hp + h.amount * (step / HEAL_OVER_TIME));
    }
    h.t += step;
    if (h.t >= HEAL_OVER_TIME || player.hp >= player.hpMax) {
      state.healActive = null;
    }
  }

  function gainXp(v) {
    const mult = player.xpGainMult * (1 + (state.xpEnemyBonus || 0));
    player.xp += v * mult;
    while (player.xp >= player.xpNeed && !state.dead) {
      player.xp -= player.xpNeed;
      player.lvl += 1;
      player.xpNeed = Math.floor(player.xpNeed * 1.12 * player.xpNeedMult + 8);
      state.chestTimer = Math.min(state.chestTimer, pF.getChestInterval());
      state.pendingLevelUps += 1;
    }
    maybeOpenLevelPicker();
  }

  return {
    gainXp,
    queueHeal,
    updateHeal,
  };
}
