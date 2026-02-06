import { ENEMY_MAX_R } from "../../content/config.js";
import {
  DOG_SPEED,
  DOG_TURN_RATE,
  DOG_HIT_COOLDOWN,
  DOG_CRIT_CHANCE,
  DOG_BALTIKA_AVOID_R,
} from "../../content/dog.js";
import { TAU } from "../../core/constants.js";
import { clamp, len2 } from "../../utils/math.js";
import { circleHit } from "../../utils/collision.js";
import { COLORS } from "../../render/colors.js";

export function createUpdateDogs({
  player,
  dogs,
  pF,
  gridQueryCircle,
  recordDamage,
  killEnemy,
}) {
  function getDogAttackRange() {
    return player.magnet * 1.25;
  }

  function pickDogTarget(excludeId) {
    const candidates = [];
    const range = getDogAttackRange();
    gridQueryCircle(player.x, player.y, range + ENEMY_MAX_R, candidates);
    let valid = 0;
    let choice = null;
    for (const e of candidates) {
      if (!e || e.dead || e.dying) continue;
      if (excludeId && e.id === excludeId) continue;
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      if ((dx * dx + dy * dy) > range * range) continue;
      valid += 1;
      if (Math.random() < 1 / valid) choice = e;
    }
    return choice;
  }

  function updateDogs(dt) {
    if (!dogs.length) return;
    for (const dog of dogs) {
      dog.hitCd = Math.max(0, dog.hitCd - dt);
      if (!dog.target || dog.target.dead || dog.target.dying) {
        dog.target = pickDogTarget();
      }

      let tx = player.x;
      let ty = player.y;
      if (dog.target) {
        tx = dog.target.x;
        ty = dog.target.y;
      } else if (pF.hasUnique("baltika9")) {
        const dxp = dog.x - player.x;
        const dyp = dog.y - player.y;
        const avoid = DOG_BALTIKA_AVOID_R;
        if ((dxp * dxp + dyp * dyp) < avoid * avoid) {
          if (dxp === 0 && dyp === 0) {
            tx = dog.x + Math.cos(dog.ang);
            ty = dog.y + Math.sin(dog.ang);
          } else {
            tx = dog.x + dxp;
            ty = dog.y + dyp;
          }
        }
      }

      const desired = Math.atan2(ty - dog.y, tx - dog.x);
      let delta = desired - dog.ang;
      while (delta > Math.PI) delta -= TAU;
      while (delta < -Math.PI) delta += TAU;
      const maxTurn = DOG_TURN_RATE * dt;
      delta = clamp(delta, -maxTurn, maxTurn);
      dog.ang += delta;

      const speed = dog.target ? DOG_SPEED * 1.25 : DOG_SPEED;
      const vx = Math.cos(dog.ang) * speed;
      const vy = Math.sin(dog.ang) * speed;
      dog.x += vx * dt;
      dog.y += vy * dt;

      if (
        dog.target &&
        dog.hitCd <= 0 &&
        circleHit(dog.x, dog.y, dog.r, dog.target.x, dog.target.y, dog.target.r)
      ) {
        const isCrit = Math.random() < DOG_CRIT_CHANCE;
        let dmg = player.damage * 2 * (isCrit ? player.critMult * 1.2 : 1);
        if (dog.target.type === "shield") dmg *= 0.65;
        dog.target.hp -= dmg;
        dog.target.hitFlash = Math.max(dog.target.hitFlash, 0.09);
        recordDamage(dmg, dog.target.x, dog.target.y, isCrit, COLORS.orangeDamage95);
        if (dog.target.hp <= 0) killEnemy(dog.target);
        const lastId = dog.target.id;
        dog.target = pickDogTarget(lastId);
        dog.hitCd = DOG_HIT_COOLDOWN;
      }
    }
  }

  return updateDogs;
}
