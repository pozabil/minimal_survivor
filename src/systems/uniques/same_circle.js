import {
  SAME_CIRCLE_DAMAGE_MULT,
  SAME_CIRCLE_INTERVAL,
  SAME_CIRCLE_LIFE,
  SAME_CIRCLE_RADIUS,
} from "../../content/uniques.js";
import {
  AURA_WAVE_BOSS_MULT,
  AURA_WAVE_ELITE_MULT,
  AURA_WAVE_POS_MULT,
  AURA_WAVE_THICKNESS,
  AURA_WAVE_VEL_MULT,
} from "../../content/upgrades.js";
import { TAU } from "../../core/constants.js";
import { clamp, len2 } from "../../utils/math.js";
import { pushAway } from "../../utils/collision.js";
import { randf, randi } from "../../utils/rand.js";
import { COLORS } from "../../render/colors.js";

const ORBITAL_HIT_KEY_CLONE = "_ohClone";

export function createUpdateSameCircle({
  pF,
  state,
  clones,
  player,
  enemies,
  shooting,
  updateOrbitalsFor,
  applyAuraFor,
  recordDamage,
  killEnemy,
  spawnBurst,
  spawnShockwave,
}) {
  function updateCloneOrbitals(c, dt){
    updateOrbitalsFor(c, c, dt, ORBITAL_HIT_KEY_CLONE);
  }

  function applyCloneAura(c, dt){
    applyAuraFor(c, c, dt);
  }

  function explodeSameCircle(c){
    const dmg = player.damage * SAME_CIRCLE_DAMAGE_MULT * pF.getWoundedDamageMult();
    spawnBurst(c.x, c.y, randi(26, 38), 380, 0.75);
    spawnBurst(c.x, c.y, randi(10, 16), 220, 0.55);
    spawnShockwave(c.x, c.y, 12, SAME_CIRCLE_RADIUS * 0.9, 0.38, COLORS.blueShockwave95);
    const force = pF.getAuraWaveForce();
    for (let i=enemies.length-1; i>=0; i--){
      const e = enemies[i];
      if (!e || e.dead || e.dying) continue;
      const d = len2(e.x - c.x, e.y - c.y);
      if (d > SAME_CIRCLE_RADIUS + e.r) continue;
      e.hp -= dmg;
      e.hitFlash = Math.max(e.hitFlash, 0.12);
      recordDamage(dmg, e.x, e.y);
      if (force > 0){
        let mult = 1;
        if (e.type === "boss") mult = AURA_WAVE_BOSS_MULT;
        else if (e.elite) mult = AURA_WAVE_ELITE_MULT;
        const band = AURA_WAVE_THICKNESS + e.r;
        const waveBand = clamp(1 - (d / Math.max(1, SAME_CIRCLE_RADIUS + band)), 0, 1);
        const smooth = Math.max(0.5, waveBand * waveBand * (3 - 2 * waveBand));
        const push = pushAway(e.x, e.y, c.x, c.y, force * mult * smooth);
        e.x += push.x * AURA_WAVE_POS_MULT;
        e.y += push.y * AURA_WAVE_POS_MULT;
        e.vx += push.x * AURA_WAVE_VEL_MULT;
        e.vy += push.y * AURA_WAVE_VEL_MULT;
      }
      if (e.hp <= 0) killEnemy(e);
    }
  }

  function updateSameCircle(dt){
    if (pF.hasUnique("same_circle")){
      state.sameCircleCd -= dt;
      if (state.sameCircleCd <= 0){
        clones.push({
          x: player.x,
          y: player.y,
          t: 0,
          life: SAME_CIRCLE_LIFE,
          shotTimer: 0,
          novaTimer: 0,
          orbitalAngle: randf(0, TAU),
          orbitalPositions: null,
          auraWaveT: 0,
          auraWaveActive: false,
          auraWaveR: 0,
          auraWaveMaxR: 0,
          auraWaveX: player.x,
          auraWaveY: player.y,
          auraWaveId: 0,
          auraTickT: 0,
        });
        state.sameCircleCd = SAME_CIRCLE_INTERVAL;
      }
    }
    for (let i=clones.length-1; i>=0; i--){
      const c = clones[i];
      c.t += dt;
      shooting.cloneShoot(c, dt);
      shooting.cloneShootNova(c, dt);
      updateCloneOrbitals(c, dt);
      applyCloneAura(c, dt);
      if (c.t >= c.life){
        explodeSameCircle(c);
        clones.splice(i,1);
      }
    }
  }

  return updateSameCircle;
}
