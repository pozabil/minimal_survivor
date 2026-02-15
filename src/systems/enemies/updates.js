import {
  XP_BONUS_NORMAL,
  XP_BONUS_ELITE,
  XP_BONUS_BOSS,
  INVULN_CONTACT_BASE,
  INVULN_CONTACT_MIN,
} from "../../content/config.js";
import {
  COLOSSUS_HP_STEP,
  COLOSSUS_SHRINK_STEP,
  COLOSSUS_SPAWN_STAGES,
} from "../../content/enemies.js";
import { circleHit, circleRectHit, pushAway } from "../../utils/collision.js";
import { clamp, len2 } from "../../utils/math.js";
import { randi } from "../../utils/rand.js";

export function createUpdateEnemies({
  enemies,
  turrets,
  player,
  state,
  pF,
  enemyCombatSystem,
  getEnemyTarget,
  spawnColossusElite,
  applyDamageToPlayer,
  handlePlayerDeath,
  formatDeathReason,
  spawnBurst,
  killEnemy,
  pruneDeadEnemies,
}) {
  const { triadShoot, explodeBomber, enemyShoot } = enemyCombatSystem;
  const xpNear = { normal: 0, elite: 0, boss: 0 };

  function updateEnemies(dt, dampFast, lerpFast) {
    pruneDeadEnemies();

    xpNear.normal = 0;
    xpNear.elite = 0;
    xpNear.boss = 0;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.dead) continue;
      if (e.dying) {
        e.deathT = Math.max(0, e.deathT - dt);
        if (e.deathT <= 0) killEnemy(e, true);
        continue;
      }
      e.hitFlash = Math.max(0, e.hitFlash - dt);
      e.auraFlash = Math.max(0, (e.auraFlash || 0) - dt);

      if (e.type === "boss" && e.bossKind === "colossus" && e.hp > 0) {
        const hpPct = e.hpMax > 0 ? (e.hp / e.hpMax) : 0;
        const stage = Math.min(
          COLOSSUS_SPAWN_STAGES,
          Math.floor((1 - clamp(hpPct, 0, 1)) / COLOSSUS_HP_STEP)
        );
        const prevStage = e.bossShrinkStage || 0;
        if (stage > prevStage) {
          for (let s = prevStage; s < stage; s++) {
            spawnColossusElite(e);
          }
          e.bossShrinkStage = stage;
          const baseR = e.bossBaseR || e.r;
          e.r = Math.max(10, baseR * (1 - COLOSSUS_SHRINK_STEP * stage));
        }
      }

      if (e.type === "triad") {
        e.triAngle = (e.triAngle || 0) + (e.triDir || 1) * (e.triSpin || 0) * dt;
        e.triShotTimer = (e.triShotTimer || 0) - dt;
        if (e.triShotTimer <= 0) {
          triadShoot(e);
          e.triShotTimer = 1 / (e.triShotRate || 0.8);
        }
      }

      const target = getEnemyTarget(e);
      const dx = target.x - e.x;
      const dy = target.y - e.y;
      const d = len2(dx, dy) || 1;
      let desiredDirX = dx / d;
      let desiredDirY = dy / d;
      let moveDirX = desiredDirX;
      let moveDirY = desiredDirY;
      switch (e.type) {
        case "spitter_pale": {
          const keepDist = e.kiteDist || 170;
          const band = 18;
          if (d < keepDist - band) {
            desiredDirX = -dx / d;
            desiredDirY = -dy / d;
          } else if (d <= keepDist + band) {
            const orbitDir = e.kiteOrbitDir || 1;
            desiredDirX = -(dy / d) * orbitDir;
            desiredDirY = (dx / d) * orbitDir;
          }
          if ((e.kiteDirX || 0) === 0 && (e.kiteDirY || 0) === 0) {
            e.kiteDirX = desiredDirX;
            e.kiteDirY = desiredDirY;
          }
          e.kiteDirX += (desiredDirX - e.kiteDirX) * lerpFast;
          e.kiteDirY += (desiredDirY - e.kiteDirY) * lerpFast;
          const kn = len2(e.kiteDirX, e.kiteDirY) || 1;
          moveDirX = e.kiteDirX / kn;
          moveDirY = e.kiteDirY / kn;
          break;
        }
        default:
          break;
      }
      e.moveDirX = moveDirX;
      e.moveDirY = moveDirY;

      if (e.type === "bomber") {
        const dist = len2(dx, dy);
        if (dist < e.explodeR * 0.55) {
          explodeBomber(i);
          continue;
        }
      }

      e.vx *= dampFast;
      e.vy *= dampFast;

      if (e.type === "dasher") {
        e.bossDashCd = Math.max(0, (e.bossDashCd || 0) - dt);
        e.bossDashT = Math.max(0, (e.bossDashT || 0) - dt);

        if (e.bossDashT > 0) {
          e.x += (e.bossDashVx || 0) * dt;
          e.y += (e.bossDashVy || 0) * dt;
        } else if ((e.bossDashCd || 0) <= 0) {
          const a = Math.atan2(target.y - e.y, target.x - e.x);
          const spd = 560 + Math.min(220, state.difficulty * 22);
          e.bossDashVx = Math.cos(a) * spd;
          e.bossDashVy = Math.sin(a) * spd;
          e.bossDashT = 0.18;
          e.bossDashCd = 1.35;
        }
      }

      if (e.type === "boss" && e.bossKind === "charger") {
        e.bossDashCd = Math.max(0, (e.bossDashCd || 0) - dt);
        e.bossDashT = Math.max(0, (e.bossDashT || 0) - dt);

        if (e.bossDashT > 0) {
          e.x += e.bossDashVx * dt;
          e.y += e.bossDashVy * dt;
        } else if (e.bossDashCd <= 0) {
          const tier = e.bossTier || 0;
          const a = Math.atan2(player.y - e.y, player.x - e.x);
          const spd = 520 + tier * 40;
          e.bossDashVx = Math.cos(a) * spd;
          e.bossDashVy = Math.sin(a) * spd;
          e.bossDashT = 0.28 + tier * 0.01;
          e.bossDashCd = 1.6 - Math.min(0.8, tier * 0.08);
        }
      }

      const isDashing =
        ((e.type === "boss" && e.bossKind === "charger") || e.type === "dasher")
        && (e.bossDashT || 0) > 0;
      const isBlasterHold = e.type === "blaster" && (e.blastKind || 0) === 1 && (e.holdT || 0) > 0;
      if (!isDashing) {
        e._slowT = Math.max(0, (e._slowT || 0) - dt);
        const spdNow = e.spd * ((e._slowT || 0) > 0 ? (e._slowMult || 1) : 1);
        if (isBlasterHold) {
          e.x += e.vx * dt;
          e.y += e.vy * dt;
        } else {
          e.x += (moveDirX * spdNow + e.vx) * dt;
          e.y += (moveDirY * spdNow + e.vy) * dt;
        }
      }

      if (e.type === "shooter" || e.type === "spitter" || e.type === "spitter_pale" || e.type === "blaster" || e.type === "boss") {
        enemyShoot(e, dt, target.x, target.y);
      }

      if (circleHit(player.x, player.y, player.r, e.x, e.y, e.r)) {
        const overlap = (player.r + e.r) - len2(player.x - e.x, player.y - e.y);
        let push = pushAway(player.x, player.y, e.x, e.y, Math.max(6, overlap * 0.6));
        if (e.type === "triad") {
          const dxp = player.x - e.x;
          const dyp = player.y - e.y;
          const dist = len2(dxp, dyp) || 1;
          const nx = dxp / dist;
          const ny = dyp / dist;
          const base = Math.max(6, overlap * 0.6);
          const pushStrength = base * 1.6;
          const tangStrength = base * 0.8;
          const tx = -ny * (e.triDir || 1);
          const ty = nx * (e.triDir || 1);
          push = {
            x: nx * pushStrength + tx * tangStrength,
            y: ny * pushStrength + ty * tangStrength,
          };
        }
        if (state.dashT > 0) {
          e.x -= push.x * 0.35;
          e.y -= push.y * 0.35;
          e.vx -= push.x * 6;
          e.vy -= push.y * 6;
        } else {
          player.x += push.x;
          player.y += push.y;
          player.vx += push.x * 18;
          player.vy += push.y * 18;
        }

        if (player.invuln <= 0) {
          applyDamageToPlayer(e.dmg);
          const baseInvuln = pF.getInvulnDuration(INVULN_CONTACT_BASE, INVULN_CONTACT_MIN);
          player.invuln = pF.getInvulnAfterHit(baseInvuln);
          spawnBurst(player.x, player.y, randi(12, 20), 260, 0.35);
          if (player.hp <= 0) {
            if (handlePlayerDeath(formatDeathReason("contact", e.type, e.bossKind))) return;
          }
        }
      }
      if (turrets.length) {
        for (let t = turrets.length - 1; t >= 0; t--) {
          const tur = turrets[t];
          if (circleRectHit(e.x, e.y, e.r, tur.x, tur.y, tur.size, tur.size)) {
            if (tur.hitCd <= 0) {
              tur.hp -= e.dmg;
              tur.hitCd = 0.25;
              spawnBurst(tur.x, tur.y, randi(6, 10), 200, 0.25);
              if (tur.hp <= 0) turrets.splice(t, 1);
            }
            const push = pushAway(e.x, e.y, tur.x, tur.y, 6);
            e.x += push.x;
            e.y += push.y;
            e.vx += push.x * 14;
            e.vy += push.y * 14;
          }
        }
      }
      const dxp = e.x - player.x;
      const dyp = e.y - player.y;
      if ((dxp * dxp + dyp * dyp) <= player.magnet * player.magnet) {
        if (e.type === "boss") xpNear.boss += 1;
        else if (e.elite) xpNear.elite += 1;
        else xpNear.normal += 1;
      }
    }

    pruneDeadEnemies();
    state.xpEnemyBonus = xpNear.normal * XP_BONUS_NORMAL
      + xpNear.elite * XP_BONUS_ELITE
      + xpNear.boss * XP_BONUS_BOSS;
  }

  return updateEnemies;
}
