import { ENEMY_MAX_R } from "../../content/enemies.js";
import {
  AURA_TICK_INTERVAL,
  AURA_WAVE_BOSS_MULT,
  AURA_WAVE_ELITE_MULT,
  AURA_WAVE_HIT_COOLDOWN,
  AURA_WAVE_POS_MULT,
  AURA_WAVE_THICKNESS,
  AURA_WAVE_TRAVEL_TIME,
  AURA_WAVE_VEL_MULT,
} from "../../content/upgrades.js";
import { pushAway } from "../../utils/collision.js";
import { clamp, len2, len2Sq } from "../../utils/math.js";

export function createAuraSystem({
  state,
  player,
  pF,
  gridQueryCircle,
  recordDamage,
  killEnemy,
}) {
  const auraCandidates = [];
  const auraWaveCandidates = [];

  function applyAuraFor(source, auraState, dt) {
    if (!player.aura) return;

    auraState.auraWaveT = Number.isFinite(auraState.auraWaveT) ? auraState.auraWaveT : 0;
    const waveLv = pF.getLevel("auraWave");
    if (waveLv > 0) {
      auraState.auraWaveT -= dt;
      if (auraState.auraWaveT <= 0) {
        auraState.auraWaveT = pF.getAuraWaveCooldown();
        auraState.auraWaveActive = true;
        auraState.auraWaveR = 0;
        auraState.auraWaveMaxR = player.auraRadius;
        auraState.auraWaveX = source.x;
        auraState.auraWaveY = source.y;
        auraState.auraWaveId = (auraState.auraWaveId || 0) + 1;
      }
    }

    const wavePrevR = auraState.auraWaveR || 0;
    if (auraState.auraWaveActive) {
      const speed = auraState.auraWaveMaxR / Math.max(0.1, AURA_WAVE_TRAVEL_TIME);
      auraState.auraWaveR += speed * dt;
      if (auraState.auraWaveR >= auraState.auraWaveMaxR + AURA_WAVE_THICKNESS) {
        auraState.auraWaveActive = false;
      }
      auraState.auraWaveX = source.x;
      auraState.auraWaveY = source.y;
    }

    const radius = player.auraRadius;
    auraState.auraTickT = Number.isFinite(auraState.auraTickT) ? auraState.auraTickT : 0;
    auraState.auraTickT -= dt;
    let auraTicks = 0;
    if (auraState.auraTickT <= 0) {
      auraTicks = Math.floor(-auraState.auraTickT / AURA_TICK_INTERVAL) + 1;
      auraState.auraTickT += auraTicks * AURA_TICK_INTERVAL;
    }
    if (auraTicks > 0) {
      const dmgPerTick = player.auraDps * pF.getWoundedDamageMult() * AURA_TICK_INTERVAL;
      gridQueryCircle(source.x, source.y, radius + ENEMY_MAX_R, auraCandidates);
      for (let i = auraCandidates.length - 1; i >= 0; i--) {
        const e = auraCandidates[i];
        if (e.dead || e.dying) continue;
        const dx = e.x - source.x;
        const dy = e.y - source.y;
        const maxR = radius + e.r;
        if (len2Sq(dx, dy) > maxR * maxR) continue;

        for (let t = 0; t < auraTicks; t++) {
          if (e.dead || e.dying) break;
          const dmg = dmgPerTick;
          e.hp -= dmg;
          e.auraFlash = Math.max(e.auraFlash || 0, 0.05);
          recordDamage(dmg, e.x, e.y);
          if (player.auraSlow > 0) {
            e._slowT = Math.max(e._slowT || 0, 0.25);
            e._slowMult = 1 - clamp(player.auraSlow, 0, 0.6);
          }
          if (e.hp <= 0) {
            killEnemy(e);
            break;
          }
        }
      }
    }

    if (auraState.auraWaveActive) {
      const waveR = auraState.auraWaveR;
      const minR = Math.min(wavePrevR, waveR);
      const maxR = Math.max(wavePrevR, waveR);
      const waveX = auraState.auraWaveX;
      const waveY = auraState.auraWaveY;
      const travel = Math.abs(waveR - wavePrevR);
      const range = maxR + AURA_WAVE_THICKNESS + ENEMY_MAX_R + travel;
      const force = pF.getAuraWaveForce();
      if (force > 0) {
        gridQueryCircle(waveX, waveY, range, auraWaveCandidates);
        for (let i = auraWaveCandidates.length - 1; i >= 0; i--) {
          const e = auraWaveCandidates[i];
          if (e.dead || e.dying) continue;
          const lastHit = Number.isFinite(e._auraWaveHitT) ? e._auraWaveHitT : -Infinity;
          if (state.t - lastHit < AURA_WAVE_HIT_COOLDOWN) continue;
          const dx = e.x - waveX;
          const dy = e.y - waveY;
          const dist = len2(dx, dy);
          if (dist > auraState.auraWaveMaxR) continue;
          const band = AURA_WAVE_THICKNESS + e.r + travel;
          const inner = Math.max(0, minR - band);
          const outer = maxR + band;
          if (dist < inner || dist > outer) continue;

          let mult = 1;
          if (e.type === "boss") mult = AURA_WAVE_BOSS_MULT;
          else if (e.elite) mult = AURA_WAVE_ELITE_MULT;

          const centerR = (minR + maxR) * 0.5;
          const waveBand = clamp(1 - Math.abs(dist - centerR) / Math.max(1, band), 0, 1);
          const smooth = Math.max(0.2, waveBand * waveBand * (3 - 2 * waveBand));
          const push = pushAway(e.x, e.y, waveX, waveY, force * mult * smooth);
          e.x += push.x * AURA_WAVE_POS_MULT;
          e.y += push.y * AURA_WAVE_POS_MULT;
          e.vx += push.x * AURA_WAVE_VEL_MULT;
          e.vy += push.y * AURA_WAVE_VEL_MULT;
          e._auraWaveHitT = state.t;
        }
      }
    }
  }

  function applyAura(dt) {
    applyAuraFor(player, state, dt);
  }

  return {
    applyAuraFor,
    applyAura,
  };
}
