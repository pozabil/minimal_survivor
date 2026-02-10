import { INVULN_CONTACT_BASE, INVULN_CONTACT_MIN } from "../../content/config.js";
import { TAU } from "../../core/constants.js";
import { COLORS } from "../../render/colors.js";
import { circleRectHit, pushAway } from "../../utils/collision.js";
import { len2 } from "../../utils/math.js";
import { randf, randi } from "../../utils/rand.js";

export function createEnemyCombatSystem({
  enemyBullets,
  enemies,
  turrets,
  player,
  pF,
  spawnBurst,
  applyDamageToPlayer,
  handlePlayerDeath,
  killEnemy,
}) {
  function enemyShoot(e, dt, tx, ty) {
    if (!e.shotRate) return;

    const tier = e.bossTier || 0;
    const shootBullet = (x, y, ang, spd, dmg, r = 4, life = 3.2, extra = null) => {
      const b = {
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r,
        dmg,
        t: 0,
        life,
        srcType: e.type,
        srcBossKind: e.bossKind || null,
      };
      if (extra) Object.assign(b, extra);
      enemyBullets.push(b);
    };
    const aim = Math.atan2(ty - e.y, tx - e.x);

    if (e.type === "blaster") {
      if ((e.blastKind || 0) === 1) {
        e.burstCd = Math.max(0, (e.burstCd || 0) - dt);
        if ((e.holdT || 0) > 0) {
          e.holdT = Math.max(0, (e.holdT || 0) - dt);
          if (e.holdT > 0) return;
          const n = randi(3, 5);
          const spread = 0.22;
          for (let i = 0; i < n; i++) {
            const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
            const ang = aim + t * spread;
            shootBullet(
              e.x,
              e.y,
              ang,
              e.shotSpeed,
              e.shotDmg,
              e.shotSize || 4,
              e.shotLife || 3.0,
              { color: e.bulletColor, glow: e.bulletGlow, explodeR: e.explodeR, explodePush: e.explodePush }
            );
          }
          e.burstCd = e.burstCooldown || 1.0;
          e.burstLeft = 0;
          e.burstTotal = 0;
          return;
        }
        if (e.burstCd > 0) return;
        e.holdT = randf(0.2, 0.4);
        return;
      }

      e.burstCd = Math.max(0, (e.burstCd || 0) - dt);
      e.shotTimer = Math.max(0, (e.shotTimer || 0) - dt);
      if ((e.burstLeft || 0) <= 0) {
        if (e.burstCd > 0) return;
        const total = randi(3, 5);
        e.burstTotal = total;
        e.burstLeft = total;
      }
      if (e.shotTimer > 0) return;
      const spread = 0.10;
      const ang = aim + randf(-spread, spread);
      shootBullet(
        e.x,
        e.y,
        ang,
        e.shotSpeed,
        e.shotDmg,
        e.shotSize || 4,
        e.shotLife || 3.0,
        { color: e.bulletColor, glow: e.bulletGlow, explodeR: e.explodeR, explodePush: e.explodePush }
      );
      e.burstLeft -= 1;
      e.shotTimer = e.burstGap || 0.12;
      if (e.burstLeft <= 0) e.burstCd = e.burstCooldown || 1.0;
      return;
    }

    e.shotTimer -= dt;
    if (e.shotTimer > 0) return;

    if (e.type !== "boss") {
      // spitter shoots a small fan
      if (e.type === "spitter") {
        const fan = 3;
        const spread = 0.26;
        for (let i = 0; i < fan; i++) {
          const t = fan === 1 ? 0 : (i / (fan - 1)) * 2 - 1;
          shootBullet(e.x, e.y, aim + t * spread, e.shotSpeed, e.shotDmg, 4, 2.8);
        }
        e.shotTimer = 1 / e.shotRate;
        return;
      }

      shootBullet(e.x, e.y, aim, e.shotSpeed, e.shotDmg, 4, 2.8);
      e.shotTimer = 1 / e.shotRate;
      return;
    }

    const kind = e.bossKind || "beholder";

    if (kind === "beholder") {
      const fan = 5 + Math.min(6, tier);
      const spread = 0.50 + tier * 0.03;
      for (let i = 0; i < fan; i++) {
        const t = fan === 1 ? 0 : (i / (fan - 1)) * 2 - 1;
        shootBullet(e.x, e.y, aim + t * spread, e.shotSpeed, e.shotDmg, 4, 3.4);
      }
      e.shotTimer = 1 / e.shotRate;
      return;
    }

    if (kind === "sniper") {
      const spd = e.shotSpeed * (1.15 + tier * 0.03);
      const dmg = e.shotDmg * (1.35 + tier * 0.08);
      const trailExtra = {
        trail: "sniper",
        color: COLORS.blueBright95,
        glow: COLORS.blueBright85,
        trailColor: COLORS.blueTrail60,
      };
      shootBullet(e.x, e.y, aim, spd, dmg, 5, 3.6, trailExtra);
      if (tier >= 2) {
        shootBullet(e.x, e.y, aim + 0.22, spd * 0.95, dmg * 0.65, 4, 3.0, trailExtra);
        shootBullet(e.x, e.y, aim - 0.22, spd * 0.95, dmg * 0.65, 4, 3.0, trailExtra);
      }
      e.shotTimer = 1 / (e.shotRate * 0.9);
      return;
    }

    if (kind === "spiral") {
      e.bossPhase += (0.55 + tier * 0.08);
      const bulletsN = 2 + Math.min(3, Math.floor(tier / 2));
      for (let k = 0; k < bulletsN; k++) {
        const ang = e.bossPhase + k * (TAU / bulletsN);
        shootBullet(e.x, e.y, ang, e.shotSpeed * (0.95 + tier * 0.03), e.shotDmg * (0.9 + tier * 0.05), 4, 3.8);
      }
      e.shotTimer = 1 / (e.shotRate * 1.15);
      return;
    }

    if (kind === "charger") {
      const burstN = 3 + Math.min(4, tier);
      const spread = 0.22 + tier * 0.02;
      for (let i = 0; i < burstN; i++) {
        const t = burstN === 1 ? 0 : (i / (burstN - 1)) * 2 - 1;
        shootBullet(e.x, e.y, aim + t * spread, e.shotSpeed * 0.95, e.shotDmg * 0.85, 4, 3.0);
      }
      e.shotTimer = 1 / (e.shotRate * 1.1);
      return;
    }

    if (kind === "summoner") {
      const fan = 3 + Math.min(2, Math.floor(tier / 2));
      const spread = 0.35;
      for (let i = 0; i < fan; i++) {
        const t = fan === 1 ? 0 : (i / (fan - 1)) * 2 - 1;
        shootBullet(e.x, e.y, aim + t * spread, e.shotSpeed * 0.9, e.shotDmg * 0.8, 4, 3.2);
      }
      e.bossPhase += 1;
      e.shotTimer = 1 / (e.shotRate * 0.95);
      return;
    }

    if (kind === "mortar") {
      // slow big balls + small shrapnel at higher tier
      const balls = 2 + Math.min(2, Math.floor(tier / 2));
      for (let i = 0; i < balls; i++) {
        const ang = aim + randf(-0.25, 0.25);
        shootBullet(e.x, e.y, ang, e.shotSpeed * 0.75, e.shotDmg * 1.35, 7, 4.0);
      }
      if (tier >= 3) {
        const fan = 6;
        for (let i = 0; i < fan; i++) {
          const ang = (e.bossPhase || 0) + i * (TAU / fan);
          shootBullet(e.x, e.y, ang, e.shotSpeed * 0.95, e.shotDmg * 0.45, 3, 2.8);
        }
        e.bossPhase = (e.bossPhase || 0) + 0.35;
      }
      e.shotTimer = 1 / (e.shotRate * 0.85);
      return;
    }

    if (kind === "warden") {
      // ring around player direction
      const n = 10 + Math.min(10, tier * 2);
      const base = e.bossPhase || 0;
      for (let i = 0; i < n; i++) {
        const ang = base + i * (TAU / n);
        shootBullet(e.x, e.y, ang, e.shotSpeed * (0.78 + tier * 0.02), e.shotDmg * (0.62 + tier * 0.03), 4, 3.8);
      }
      e.bossPhase = base + 0.18 + tier * 0.015;
      e.shotTimer = 1 / (e.shotRate * 0.70);
      return;
    }

    if (kind === "vortex") {
      // alternating spiral towards the player
      const steps = 4 + Math.min(4, Math.floor(tier / 2));
      const base = (e.bossPhase || 0) + 0.9;
      for (let k = 0; k < steps; k++) {
        const ang = base + k * 0.35;
        shootBullet(e.x, e.y, ang, e.shotSpeed * (0.9 + tier * 0.02), e.shotDmg * (0.70 + tier * 0.03), 4, 4.2);
        shootBullet(e.x, e.y, ang + Math.PI, e.shotSpeed * (0.75 + tier * 0.02), e.shotDmg * (0.50 + tier * 0.02), 3, 4.2);
      }
      e.bossPhase = base;
      e.shotTimer = 1 / (e.shotRate * 0.90);
      return;
    }

    shootBullet(e.x, e.y, aim, e.shotSpeed, e.shotDmg, 4, 3.2);
    e.shotTimer = 1 / e.shotRate;
  }

  function triadShoot(e) {
    const n = 3;
    const rad = e.triRad || 22;
    const spd = e.triShotSpeed || 260;
    const dmg = e.triShotDmg || 9;
    for (let k = 0; k < n; k++) {
      const ang = (e.triAngle || 0) + k * (TAU / n);
      const sx = e.x + Math.cos(ang) * rad;
      const sy = e.y + Math.sin(ang) * rad;
      enemyBullets.push({
        x: sx,
        y: sy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 4,
        dmg,
        t: 0,
        life: 3.0,
        srcType: e.type,
        srcBossKind: null,
      });
    }
  }

  // Bomber explode
  function explodeBomber(i) {
    const e = enemies[i];
    if (!e || e.type !== "bomber") return;

    spawnBurst(e.x, e.y, randi(24, 34), 340, 0.50);

    // damage player
    const dxp = player.x - e.x;
    const dyp = player.y - e.y;
    const dp = len2(dxp, dyp);
    if (dp < e.explodeR && player.invuln <= 0) {
      const mult = 1 - dp / e.explodeR; // 0..1
      const dmg = e.explodeDmg * (0.55 + 0.45 * mult);
      applyDamageToPlayer(dmg, true, true);
      const baseInvuln = pF.getInvulnDuration(INVULN_CONTACT_BASE, INVULN_CONTACT_MIN);
      player.invuln = pF.getInvulnAfterHit(baseInvuln);

      const push = pushAway(player.x, player.y, e.x, e.y, 18 + 22 * mult);
      player.x += push.x;
      player.y += push.y;
      player.vx += push.x * 22;
      player.vy += push.y * 22;

      if (player.hp <= 0) {
        if (handlePlayerDeath("bomber explosion")) return;
      }
    }

    // damage turrets
    if (turrets.length) {
      for (let t = turrets.length - 1; t >= 0; t--) {
        const tur = turrets[t];
        if (circleRectHit(e.x, e.y, e.explodeR, tur.x, tur.y, tur.size, tur.size)) {
          const dtur = len2(tur.x - e.x, tur.y - e.y);
          const mult = 1 - dtur / e.explodeR;
          const dmg = e.explodeDmg * (0.55 + 0.45 * mult);
          tur.hp -= dmg;
          tur.hitCd = Math.max(tur.hitCd, 0.2);
          spawnBurst(tur.x, tur.y, randi(8, 12), 220, 0.30);
          if (tur.hp <= 0) turrets.splice(t, 1);
        }
      }
    }

    // damage other enemies
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (j === i) continue;
      const ee = enemies[j];
      if (!ee || ee.dead) continue;
      const d = len2(ee.x - e.x, ee.y - e.y);
      if (d < e.explodeR) {
        const mult = 1 - d / e.explodeR;
        const dmg = 22 * (0.5 + 0.5 * mult);
        ee.hp -= dmg;
        ee.hitFlash = Math.max(ee.hitFlash, 0.08);
        if (ee.hp <= 0) killEnemy(ee);
      }
    }

    killEnemy(e);
  }

  return {
    enemyShoot,
    triadShoot,
    explodeBomber,
  };
}
