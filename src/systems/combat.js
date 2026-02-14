import { TAU, DPS_WINDOW_SEC } from "../core/constants.js";
import {
  TURRET_BULLET_SIZE,
  TURRET_BULLET_SPEED,
  TURRET_RANGE,
} from "../content/upgrades.js";
import { clamp, len2 } from "../utils/math.js";
import { randf } from "../utils/rand.js";

export function tryApplyLifeStealHeal(player, spawnHealFloat) {
  const baseHeal = player.hpMax * 0.01;
  const heal = (baseHeal < 1) ? (Math.random() < baseHeal ? 1 : 0) : baseHeal;
  if (heal <= 0) return 0;
  const before = player.hp;
  player.hp = Math.min(player.hpMax, player.hp + heal);
  const healed = player.hp - before;
  if (healed > 0) spawnHealFloat(healed);
  return healed;
}

export function createRicochetHelpers({ bullets, targeting }) {
  function canRicochet(b) {
    return (b.ricochetLeft || 0) > 0 && (b.ricochetChance || 0) > 0;
  }

  function tryFindRicochetTarget(hitEnemy, b) {
    return targeting.findRicochetTarget(hitEnemy.x, hitEnemy.y, hitEnemy.id, b.lastHitId);
  }

  function applyRicochetRedirect(b, hitEnemy, target, spd) {
    const dx = target.x - hitEnemy.x;
    const dy = target.y - hitEnemy.y;
    const d = len2(dx, dy) || 1;
    b.vx = (dx / d) * spd;
    b.vy = (dy / d) * spd;
    b.x = hitEnemy.x + (dx / d) * (hitEnemy.r + b.r + 2);
    b.y = hitEnemy.y + (dy / d) * (hitEnemy.r + b.r + 2);
    b.ricochetLeft -= 1;
    b.lastHitId = hitEnemy.id;
  }

  function spawnCheapRicochetSplits(b, hitEnemy, targetId, spd, baseAng) {
    const ricochetLeft = Math.max(0, (b.ricochetLeft || 0) - 1);
    const shrink = 0.707;
    const dmgShrink = 0.56;
    const newR = b.r * shrink;
    const newDmg = b.dmg * dmgShrink;
    const newBaseDmg = (b.baseDmg || b.dmg) * dmgShrink;
    const maxSpread = Math.PI / 3; // <= 60°
    const target2 = targeting.findRicochetTargetWithinAngle(
      hitEnemy.x, hitEnemy.y,
      targetId, hitEnemy.id, b.lastHitId,
      baseAng, maxSpread
    );
    const ang2 = target2
      ? Math.atan2(target2.y - hitEnemy.y, target2.x - hitEnemy.x)
      : (baseAng + randf(-maxSpread, maxSpread));
    const spawnSplit = (ang) => {
      const hitIds = b.hitIds ? new Set(b.hitIds) : null;
      bullets.push({
        x: hitEnemy.x + Math.cos(ang) * (hitEnemy.r + newR + 2),
        y: hitEnemy.y + Math.sin(ang) * (hitEnemy.r + newR + 2),
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: newR,
        dmg: newDmg,
        baseDmg: newBaseDmg,
        pierce: b.pierce,
        life: b.life,
        t: b.t,
        isNova: b.isNova,
        ricochetLeft,
        ricochetChance: b.ricochetChance,
        lastHitId: hitEnemy.id,
        hitIds,
      });
    };
    spawnSplit(baseAng);
    spawnSplit(ang2);
  }

  return {
    canRicochet,
    tryFindRicochetTarget,
    applyRicochetRedirect,
    spawnCheapRicochetSplits,
  };
}

// Damage tracking (outgoing damage + DPS)
export function createDamageTracker({
  state,
  player,
  options,
  spawnDamageFloat,
  spawnHealFloat,
}) {
  let dmgHead = 0;
  const COMPACT_HEAD_THRESHOLD = 256; // numbers in flat [t, dmg, t, dmg, ...] buffer

  function recordDamage(amount, x, y, showNumber = false, color = null, size = null) {
    state.dmgDone += amount;
    if (options.showDamageNumbers && showNumber && Number.isFinite(x) && Number.isFinite(y)) {
      spawnDamageFloat(amount, x, y, color, size);
    }
    // lifesteal
    if (player.lifeSteal > 0 && amount > 0) {
      const minLsDamage = player.hpMax * 0.08;
      if (amount > minLsDamage) {
        const chance = 0.01 * player.lifeSteal;
        if (Math.random() < chance) {
          tryApplyLifeStealHeal(player, spawnHealFloat);
        }
      }
    }

    state.lastDmgWindow.push(state.t, amount);
    const cutoff = state.t - DPS_WINDOW_SEC;
    while (dmgHead + 1 < state.lastDmgWindow.length && state.lastDmgWindow[dmgHead] < cutoff) {
      dmgHead += 2;
    }

    // Compact rarely to avoid unbounded growth.
    if (dmgHead >= COMPACT_HEAD_THRESHOLD && dmgHead * 2 >= state.lastDmgWindow.length) {
      state.lastDmgWindow.copyWithin(0, dmgHead);
      state.lastDmgWindow.length -= dmgHead;
      dmgHead = 0;
    }
  }

  function getDps() {
    const cutoff = state.t - DPS_WINDOW_SEC;
    let sum = 0;
    for (let i = dmgHead; i + 1 < state.lastDmgWindow.length; i += 2) {
      const t = state.lastDmgWindow[i];
      if (t < cutoff) continue;
      sum += state.lastDmgWindow[i + 1] || 0;
    }
    return Math.round(sum / DPS_WINDOW_SEC);
  }

  return { recordDamage, getDps };
}

// Player damage (incoming damage)
export function createPlayerDamageApplier({ state, player, options, spawnDamageFloat }) {
  function applyDamageToPlayer(raw, avoidDodge = false, avoidArmor = false) {
    if (raw <= 0) return 0;
    if (state.dead) return 0;

    // dodge
    if (!avoidDodge && player.dodge > 0 && Math.random() < player.dodge) return 0;

    // armor cap 60%
    const arm = avoidArmor ? 0 : clamp(player.armor, 0, 0.60);
    const dmg = raw * (1 - arm) * player.damageTakenMult;

    player.hp -= dmg;
    if (player.hp < 0) player.hp = 0;
    if (options.showDamageNumbers) spawnDamageFloat(dmg, player.x, player.y);

    return dmg;
  }

  return applyDamageToPlayer;
}

export function createShootingSystem({ player, bullets, pF, targeting, spawnTurret }) {
  function tryFireShotsFrom(source, dt, targetFn) {
    source.shotTimer -= dt;
    if (source.shotTimer > 0) return false;
    const target = targetFn(source.x, source.y);
    if (!target) return false;

    const baseAngle = Math.atan2(target.y - source.y, target.x - source.x);
    const shots = player.multishot;
    // For 2-shot, force 0.16 rad between bullets (spread is half of that).
    const spread = (shots === 2) ? 0.08 : player.spread;

    for (let i = 0; i < shots; i++) {
      const t = (shots === 1) ? 0 : (i / (shots - 1)) * 2 - 1;
      const a = baseAngle + t * spread + randf(-0.01, 0.01);
      bullets.push({
        x: source.x, y: source.y,
        vx: Math.cos(a) * player.bulletSpeed,
        vy: Math.sin(a) * player.bulletSpeed,
        r: player.bulletSize,
        dmg: player.damage * pF.getWoundedDamageMult(),
        baseDmg: player.damage * pF.getWoundedDamageMult(),
        pierce: player.pierce,
        life: 3.2, // было 1.6
        t: 0,
        ricochetLeft: pF.getRicochetBounces(),
        ricochetChance: player.ricochetChance,
        lastHitId: null,
      });
    }
    source.shotTimer = 1 / player.fireRate;
    return true;
  }

  function tryFireNovaFrom(source, dt) {
    if (player.novaCount <= 0) return false;
    source.novaTimer -= dt;
    if (source.novaTimer > 0) return false;

    const shots = Math.max(1, player.novaCount * 3);
    const offset = randf(0, TAU);
    for (let i = 0; i < shots; i++) {
      const a = offset + i * (TAU / shots);
      bullets.push({
        x: source.x, y: source.y,
        vx: Math.cos(a) * player.novaSpeed,
        vy: Math.sin(a) * player.novaSpeed,
        r: Math.max(4, player.bulletSize * 1.15),
        dmg: player.novaDamage * pF.getWoundedDamageMult(),
        baseDmg: player.novaDamage * pF.getWoundedDamageMult(),
        pierce: 1,
        life: 3.0,
        t: 0,
        isNova: true,
        ricochetLeft: pF.getRicochetBounces(),
        ricochetChance: player.ricochetChance,
        lastHitId: null,
      });
    }
    source.novaTimer = 1 / player.novaRate;
    return true;
  }

  function shoot(dt) {
    const didShoot = tryFireShotsFrom(player, dt, (x, y) => targeting.findNearestEnemyFrom(x, y));
    if (didShoot && pF.getTurretChance() > 0 && Math.random() < pF.getTurretChance()) spawnTurret();
  }

  function shootNova(dt) {
    return tryFireNovaFrom(player, dt);
  }

  function cloneShoot(c, dt) {
    return tryFireShotsFrom(c, dt, (x, y) => targeting.findNearestEnemyFrom(x, y));
  }

  function cloneShootNova(c, dt) {
    return tryFireNovaFrom(c, dt);
  }

  function tryFireTurret(t, dt) {
    t.shotTimer -= dt;
    if (t.shotTimer > 0) return false;
    const target = targeting.findNearestEnemyTo(t.x, t.y, TURRET_RANGE);
    if (target) {
      const ang = Math.atan2(target.y - t.y, target.x - t.x);
      bullets.push({
        x: t.x, y: t.y,
        vx: Math.cos(ang) * TURRET_BULLET_SPEED,
        vy: Math.sin(ang) * TURRET_BULLET_SPEED,
        r: TURRET_BULLET_SIZE,
        dmg: pF.getTurretDamage(),
        baseDmg: pF.getTurretDamage(),
        pierce: 1,
        life: 2.6,
        t: 0,
        ricochetLeft: pF.getRicochetBounces(),
        ricochetChance: player.ricochetChance,
        lastHitId: null,
      });
    }
    t.shotTimer = 1 / pF.getTurretFireRate();
    return !!target;
  }

  return {
    shoot,
    shootNova,
    cloneShoot,
    cloneShootNova,
    tryFireTurret,
  };
}
