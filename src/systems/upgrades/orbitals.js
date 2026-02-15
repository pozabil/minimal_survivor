import { ENEMY_MAX_R } from "../../content/enemies.js";
import {
  ORBITAL_SPEED_UP_MAX_LEVEL,
  ORBITAL_SPIRAL_MAX_RADIUS_RATIO,
  ORBITAL_SPIRAL_MIN_RADIUS_RATIO,
  ORBITAL_SPIRAL_PHASE_SPEED_BASE,
  ORBITAL_SPIRAL_PHASE_SPEED_MIN,
} from "../../content/uniques.js";
import { ORBITAL_KNOCKBACK_CHANCE, ORBITAL_KNOCKBACK_FORCE } from "../../content/upgrades.js";
import { HALF_PI, TAU } from "../../core/constants.js";
import { circleHit } from "../../utils/collision.js";
import { len2 } from "../../utils/math.js";

const ORBITAL_HIT_KEY_PLAYER = "_oh";

function ensureOrbitalPositions(orbitalsState, count) {
  const expectedLen = count * 2;
  const prev = orbitalsState.orbitalPositions;
  if (!prev || prev.length !== expectedLen) {
    orbitalsState.orbitalPositions = new Float32Array(expectedLen);
  }
  return orbitalsState.orbitalPositions;
}

export function createOrbitalsSystem({
  player,
  state,
  pF,
  gridQueryCircle,
  recordDamage,
  killEnemy,
}) {
  const orbitalCandidates = [];

  function updateOrbitalsFor(source, orbitalsState, dt, hitKey) {
    if (player.orbitals <= 0) {
      orbitalsState.orbitalPositions = null;
      return;
    }
    const count = player.orbitals;
    orbitalsState.orbitalAngle = ((orbitalsState.orbitalAngle || 0) + player.orbitalSpeed * dt) % TAU;
    const baseAngle = orbitalsState.orbitalAngle || 0;
    const stepA = TAU / count;
    const positions = ensureOrbitalPositions(orbitalsState, count);
    const hasSpiralGloves = pF.hasUnique("trigonometric_gloves");
    const orbSize = pF.getOrbitalSize();
    const baseRadius = player.orbitalRadius;
    let spiralBaseRadius = 0;
    let spiralSpan = 0;
    let spiralPhase = 0;
    let invCount = 0;
    if (hasSpiralGloves) {
      invCount = 1 / count;
      spiralBaseRadius = baseRadius * ORBITAL_SPIRAL_MIN_RADIUS_RATIO;
      spiralSpan = baseRadius * (ORBITAL_SPIRAL_MAX_RADIUS_RATIO - ORBITAL_SPIRAL_MIN_RADIUS_RATIO);
      spiralPhase = orbitalsState.orbitalSpiralPhase || 0;
      const speedUpLevel = pF.getLevel("orbitalSpeedUp");
      const t = Math.min(1, Math.max(0, speedUpLevel / ORBITAL_SPEED_UP_MAX_LEVEL));
      const phaseSpeed =
        ORBITAL_SPIRAL_PHASE_SPEED_BASE +
        (ORBITAL_SPIRAL_PHASE_SPEED_MIN - ORBITAL_SPIRAL_PHASE_SPEED_BASE) * t;
      spiralPhase = (spiralPhase + (dt * player.orbitalSpeed * phaseSpeed) / TAU) % 1;
      orbitalsState.orbitalSpiralPhase = spiralPhase;
    }

    for (let k = 0; k < count; k++) {
      const a = baseAngle + k * stepA;
      let radius = baseRadius;
      if (hasSpiralGloves) {
        const localPhase = (spiralPhase + k * invCount) % 1;
        const wave = Math.sin(localPhase * HALF_PI);
        radius = spiralBaseRadius + wave * spiralSpan;
      }
      const ox = source.x + Math.cos(a) * radius;
      const oy = source.y + Math.sin(a) * radius;
      const pi = k * 2;
      positions[pi] = ox;
      positions[pi + 1] = oy;

      gridQueryCircle(ox, oy, orbSize + ENEMY_MAX_R, orbitalCandidates);
      for (let i = orbitalCandidates.length - 1; i >= 0; i--) {
        const e = orbitalCandidates[i];
        if (e.dead || e.dying) continue;
        if (!e[hitKey]) e[hitKey] = new Float32Array(24);
        e[hitKey][k] = Math.max(0, (e[hitKey][k] || 0) - dt);
        if (e[hitKey][k] > 0) continue;

        if (circleHit(ox, oy, orbSize, e.x, e.y, e.r)) {
          e[hitKey][k] = player.orbitalHitCD;
          const dmg = player.orbitalDamage * pF.getWoundedDamageMult();
          e.hp -= dmg;
          e.hitFlash = 0.09;
          recordDamage(dmg, e.x, e.y);

          if (Math.random() < ORBITAL_KNOCKBACK_CHANCE) {
            const dx = e.x - ox;
            const dy = e.y - oy;
            const d = len2(dx, dy) || 1;
            e.vx += (dx / d) * ORBITAL_KNOCKBACK_FORCE;
            e.vy += (dy / d) * ORBITAL_KNOCKBACK_FORCE;
          }

          if (e.hp <= 0) killEnemy(e);
        }
      }
    }
  }

  function updateOrbitals(dt) {
    updateOrbitalsFor(player, state, dt, ORBITAL_HIT_KEY_PLAYER);
  }

  return {
    updateOrbitalsFor,
    updateOrbitals,
  };
}
