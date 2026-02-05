import {
  TOTEM_EFFECT_DECAY,
  TOTEM_DPS_BASE,
  TOTEM_EFFECT_MAX,
} from "../content/totem.js";

export function updateTotem({
  dt,
  totem,
  player,
  pF,
  applyDamageToPlayer,
  handlePlayerDeath,
}) {
  if (totem.active) {
    totem.t += dt;
    totem.life = Math.max(0, totem.life - dt);
    totem.grace = Math.max(0, totem.grace - dt);

    const dxT = player.x - totem.x;
    const dyT = player.y - totem.y;
    const inZone = (dxT * dxT + dyT * dyT) <= totem.r * totem.r;
    totem.inZone = inZone;

    if (totem.grace <= 0 && !inZone) {
      totem.effect = Math.min(TOTEM_EFFECT_MAX, totem.effect + dt * pF.getTotemEffectGain());
      const dps = TOTEM_DPS_BASE + pF.getTotemDpsRamp() * totem.effect;
      const dmg = applyDamageToPlayer(dps * dt);
      if (dmg > 0 && player.hp <= 0) {
        if (handlePlayerDeath("totem")) return true;
      }
    } else if (inZone) {
      totem.effect = Math.max(0, totem.effect - dt * TOTEM_EFFECT_DECAY);
      if (pF.hasUnique("peace_pipe") && player.hp > 0) {
        const regenLv = pF.getLevel("regen");
        const bonus = 1 + Math.round(0.5 * regenLv);
        player.hp = Math.min(player.hpMax, player.hp + bonus * dt);
      }
    }

    if (totem.life <= 0) {
      totem.active = false;
      totem.life = 0;
      totem.grace = 0;
      totem.inZone = false;
    }
  } else if (totem.effect > 0) {
    totem.effect = Math.max(0, totem.effect - dt * TOTEM_EFFECT_DECAY * 0.7);
  }

  return false;
}
