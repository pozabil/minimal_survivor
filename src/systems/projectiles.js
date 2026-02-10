import {
  INVULN_BULLET_BASE,
  INVULN_BULLET_MIN,
} from "../content/config.js";
import { ENEMY_MAX_R } from "../content/enemies.js";
import {
  PIERCE_DAMAGE_FALLOFF,
  PIERCE_DAMAGE_MIN_RATIO,
} from "../content/upgrades.js";
import { COLORS } from "../render/colors.js";
import { circleHit, circleRectHit, pushAway } from "../utils/collision.js";
import { len2 } from "../utils/math.js";
import { randi } from "../utils/rand.js";

export function createUpdateBullets({
  bullets,
  player,
  pF,
  gridQueryCircle,
  ricochetHelpers,
  killEnemy,
  recordDamage,
}) {
  const {
    canRicochet,
    tryFindRicochetTarget,
    applyRicochetRedirect,
    spawnCheapRicochetSplits,
  } = ricochetHelpers;

  const candidates = [];

  function updateBullets(dt) {
    for (let i=bullets.length-1;i>=0;i--){
      const b=bullets[i];
      b.t += dt;
      b.x += b.vx*dt;
      b.y += b.vy*dt;
      if (b.t >= b.life){ bullets.splice(i,1); continue; }

      gridQueryCircle(b.x, b.y, b.r + ENEMY_MAX_R, candidates);
      for (let j=candidates.length-1;j>=0;j--){
        const e=candidates[j];
        if (e.dead || e.dying) continue;
        if (b.lastHitId && e.id === b.lastHitId) continue;
        if (b.hitIds && b.hitIds.has(e.id)) continue;
        if (!circleHit(b.x,b.y,b.r, e.x,e.y,e.r)) continue;

        const isCrit = Math.random() < player.critChance;
        let dmg = b.dmg * (isCrit ? player.critMult : 1);
        // shield enemy takes reduced bullet damage
        if (e.type === "shield") dmg *= 0.65;
        e.hp -= dmg;
        e.hitFlash = 0.09;
        const dmgSize = (e.type === "boss") ? 32 : null;
        recordDamage(dmg, e.x, e.y, isCrit, COLORS.orangeDamage95, dmgSize);
        if (!b.hitIds) b.hitIds = new Set();
        b.hitIds.add(e.id);

        let didRicochet = false;
        let removedOnRicochet = false;
        if (canRicochet(b) && Math.random() < b.ricochetChance){
          const target = tryFindRicochetTarget(e, b);
          if (target){
            const dx = target.x - e.x;
            const dy = target.y - e.y;
            const spd = len2(b.vx, b.vy) || player.bulletSpeed;
            const baseAng = Math.atan2(dy, dx);

            if (pF.hasUnique("cheap_bullets")){
              spawnCheapRicochetSplits(b, e, target.id, spd, baseAng);
              bullets.splice(i,1);
              removedOnRicochet = true;
              didRicochet = true;
            } else {
              applyRicochetRedirect(b, e, target, spd);
              didRicochet = true;
            }
          }
        }

        if (!b.isNova && !removedOnRicochet){
          if (!didRicochet) b.pierce -= 1;
          if (b.pierce<=0 && !didRicochet){
            bullets.splice(i,1);
          } else if (!didRicochet) {
            const minDmg = (b.baseDmg || b.dmg) * PIERCE_DAMAGE_MIN_RATIO;
            b.dmg = Math.max(b.dmg * PIERCE_DAMAGE_FALLOFF, minDmg);
          }
        }

        if (e.hp<=0) killEnemy(e);
        break;
      }
    }
  }

  return updateBullets;
}

export function createUpdateEnemyBullets({
  enemyBullets,
  turrets,
  player,
  pF,
  spawnBurst,
  applyDamageToPlayer,
  handlePlayerDeath,
  formatDeathReason,
}) {
  function updateEnemyBullets(dt) {
    for (let i=enemyBullets.length-1;i>=0;i--){
      const b=enemyBullets[i];
      b.t += dt;
      b.x += b.vx*dt;
      b.y += b.vy*dt;
      if (b.t >= b.life){ enemyBullets.splice(i,1); continue; }

      if (turrets.length){
        let hitTurret = false;
        for (let t=turrets.length-1; t>=0; t--){
          const tur = turrets[t];
          if (circleRectHit(b.x,b.y,b.r, tur.x,tur.y, tur.size, tur.size)){
            tur.hp -= b.dmg;
            tur.hitCd = Math.max(tur.hitCd, 0.1);
            if (b.explodeR) spawnBurst(b.x,b.y, randi(10,16), 260, 0.32);
            else spawnBurst(tur.x,tur.y, randi(6,10), 200, 0.25);
            enemyBullets.splice(i,1);
            if (tur.hp <= 0) turrets.splice(t,1);
            hitTurret = true;
            break;
          }
        }
        if (hitTurret) continue;
      }

      if (circleHit(b.x,b.y,b.r, player.x,player.y, player.r)){
        if (player.invuln<=0){
          applyDamageToPlayer(b.dmg);
          const baseInvuln = pF.getInvulnDuration(INVULN_BULLET_BASE, INVULN_BULLET_MIN);
          player.invuln = pF.getInvulnAfterHit(baseInvuln);
          if (b.explodeR){
            const push = pushAway(player.x, player.y, b.x, b.y, b.explodePush || 16);
            player.x += push.x;
            player.y += push.y;
            player.vx += push.x * 18;
            player.vy += push.y * 18;
            spawnBurst(b.x,b.y, randi(12,18), 280, 0.36);
          } else {
            spawnBurst(player.x,player.y, randi(10,16), 240, 0.32);
          }
          enemyBullets.splice(i,1);
          if (player.hp<=0){
            const reason = formatDeathReason("bullet", b.srcType, b.srcBossKind);
            if (handlePlayerDeath(reason)) return;
          }
        } else enemyBullets.splice(i,1);
      }
    }
  }

  return updateEnemyBullets;
}
