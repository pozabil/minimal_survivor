import { ENEMY_MAX_R } from "../../content/enemies.js";
import { ORBITAL_KNOCKBACK_CHANCE, ORBITAL_KNOCKBACK_FORCE } from "../../content/upgrades.js";
import { TAU } from "../../core/constants.js";
import { circleHit } from "../../utils/collision.js";
import { len2 } from "../../utils/math.js";

const ORBITAL_HIT_KEY_PLAYER = "_oh";

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
    if (player.orbitals <= 0) return;
    orbitalsState.orbitalAngle = (orbitalsState.orbitalAngle || 0) + player.orbitalSpeed * dt;
    const orbSize = pF.getOrbitalSize();

    for (let k = 0; k < player.orbitals; k++) {
      const a = orbitalsState.orbitalAngle + (k / Math.max(1, player.orbitals)) * TAU;
      const ox = source.x + Math.cos(a) * player.orbitalRadius;
      const oy = source.y + Math.sin(a) * player.orbitalRadius;

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
