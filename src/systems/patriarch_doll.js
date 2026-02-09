import {
  PATRIARCH_DOLL_COOLDOWN,
  PATRIARCH_DOLL_DAMAGE_MULT,
  PATRIARCH_DOLL_TARGETS_MIN,
  PATRIARCH_DOLL_TARGETS_MAX,
} from "../content/uniques.js";
import { randi } from "../utils/rand.js";

export function createUpdatePatriarchDoll({
  pF,
  state,
  player,
  enemies,
  spawnLightningStrike,
  recordDamage,
  spawnBurst,
  killEnemy,
}) {
  const aliveCandidates = [];

  function tryActivatePatriarchDoll() {
    if (!pF.hasUnique("patriarch_doll")) return false;
    if (state.patriarchDollCd > 0) return false;

    aliveCandidates.length = 0;
    const range = Math.min(800, 380 + player.lvl * 4);
    const range2 = range * range;
    for (const e of enemies) {
      if (!e || e.dead || e.dying) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if ((dx * dx + dy * dy) > range2) continue;
      aliveCandidates.push(e);
    }
    if (!aliveCandidates.length) return false;

    const hits = Math.min(randi(PATRIARCH_DOLL_TARGETS_MIN, PATRIARCH_DOLL_TARGETS_MAX), aliveCandidates.length);
    const baseDmg = player.damage * PATRIARCH_DOLL_DAMAGE_MULT;
    for (let i = 0; i < hits; i++) {
      const idx = randi(i, aliveCandidates.length - 1);
      const tmp = aliveCandidates[i];
      aliveCandidates[i] = aliveCandidates[idx];
      aliveCandidates[idx] = tmp;
      const e = aliveCandidates[i];
      spawnLightningStrike(e.x, e.y);
      let dmg = baseDmg;
      if (e.type === "shield") dmg *= 0.65;
      e.hp -= dmg;
      e.hitFlash = Math.max(e.hitFlash, 0.12);
      recordDamage(dmg, e.x, e.y);
      spawnBurst(e.x, e.y, randi(8, 12), 260, 0.25);
      if (e.hp <= 0) killEnemy(e);
    }
    return true;
  }

  function updatePatriarchDoll(dt) {
    if (!pF.hasUnique("patriarch_doll")) return;
    if (state.patriarchDollCd > 0) {
      state.patriarchDollCd = Math.max(0, state.patriarchDollCd - dt);
      return;
    }
    tryActivatePatriarchDoll();
    state.patriarchDollCd = PATRIARCH_DOLL_COOLDOWN;
  }

  return updatePatriarchDoll;
}
