import { BURST_TELEGRAPH } from "../../content/enemies.js";
import { TAU } from "../../core/constants.js";
import { tryApplyLifeStealHeal } from "../combat.js";
import { randf, randi } from "../../utils/rand.js";

export function createEnemyDeathSystem({
  state,
  player,
  spawn,
  enemies,
  enemyBullets,
  spawnEnemy,
  maxShirt,
  spawnBurst,
  spawnHealFloat,
  dropXp,
  dropHeal,
  elBossWrap,
}) {
  function killEnemy(e, immediate = false) {
    if (!e || e.dead) return;
    if (e.type === "burst" && !immediate) {
      if (!e.dying) {
        e.dying = true;
        e.deathT = BURST_TELEGRAPH;
        e.hitFlash = Math.max(e.hitFlash, 0.12);
        e.vx = 0;
        e.vy = 0;
      }
      return;
    }

    e.dead = true;
    state.kills += 1;
    maxShirt.onEnemyKill();
    spawnBurst(e.x, e.y, randi(10, 16), 220, 0.35);
    dropXp(e.x, e.y, e.xp);

    if (player.lifeSteal > 0) {
      let mult = 1;
      if (e.type === "boss") mult = 5;
      else if (e.elite) mult = 2;
      if (Math.random() < 0.02 * mult) {
        tryApplyLifeStealHeal(player, spawnHealFloat);
      }
    }

    if (e.elite) {
      const bonus = e.eliteReward ? Math.round(e.xp * 1.2) : Math.round(e.xp * 0.4);
      dropXp(e.x, e.y, bonus);
      if (e.eliteReward && Math.random() < 0.35) {
        player.rerolls = Math.min(player.rerollCap, player.rerolls + 1);
      }
      if (Math.random() < 0.02) {
        dropHeal(e.x, e.y, player.hpMax * randf(0.25, 0.50));
      }
    }

    if (e.type === "burst") {
      const n = Math.max(1, e.burstN || 6);
      const spd = e.burstSpeed || 260;
      const dmg = e.burstDmg || 9;
      const offset = randf(0, TAU);
      for (let k = 0; k < n; k++) {
        const ang = offset + k * (TAU / n);
        enemyBullets.push({
          x: e.x,
          y: e.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          r: 4,
          dmg,
          t: 0,
          life: 2.8,
          srcType: e.type,
          srcBossKind: null,
        });
      }
    }

    if (e.type === "splitter") {
      const n = 2 + (Math.random() < 0.35 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const a = randf(0, TAU);
        const rr = randf(12, 24);
        spawnEnemy(false, "minion", {
          spawnX: e.x + Math.cos(a) * rr,
          spawnY: e.y + Math.sin(a) * rr,
          minion: true,
        });
      }
    }

    if (e.type === "boss") {
      spawn.bossActive = Math.max(0, spawn.bossActive - 1);
      if (spawn.bossActive <= 0) elBossWrap.style.display = "none";
      player.hp = Math.min(player.hpMax, player.hp + 30);
      for (let i = 0; i < 8; i++) dropXp(e.x + randf(-20, 20), e.y + randf(-20, 20), 14);
      if (Math.random() < 0.10) {
        dropHeal(e.x, e.y, player.hpMax * randf(0.25, 0.50));
      }
    }
  }

  function pruneDeadEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].dead) enemies.splice(i, 1);
    }
  }

  return {
    killEnemy,
    pruneDeadEnemies,
  };
}
