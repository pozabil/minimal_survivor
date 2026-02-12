import { TAU } from "../core/constants.js";
import { len2 } from "../utils/math.js";
import { randf } from "../utils/rand.js";

export function createSpawnDrops({ drops }) {
  function dropXp(x, y, amount) {
    const n = Math.max(1, Math.round(amount / 10));
    for (let i = 0; i < n; i++) {
      drops.push({
        x: x + randf(-10, 10),
        y: y + randf(-10, 10),
        r: 6,
        v: amount / n,
        vx: randf(-60, 60),
        vy: randf(-60, 60),
        t: 0,
        kind: "xp",
      });
    }
  }

  function dropHeal(x, y, amount) {
    drops.push({
      x: x + randf(-8, 8),
      y: y + randf(-8, 8),
      r: 7,
      v: amount,
      vx: randf(-50, 50),
      vy: randf(-50, 50),
      t: 0,
      kind: "heal",
      life: 60,
      pulse: randf(0, TAU),
    });
  }

  return {
    dropXp,
    dropHeal,
  };
}

export function createUpdateDrops({
  drops,
  player,
  bullets,
  turrets,
  pF,
  queueHeal,
  gainXp,
}) {
  const novaBulletsThisFrame = [];

  function updateDrops(dt, dampFast) {
    const novaMagnetR = pF.getNovaMagnetRadius();
    novaBulletsThisFrame.length = 0;
    if (novaMagnetR > 0){
      for (const b of bullets){
        if (b.isNova) novaBulletsThisFrame.push(b);
      }
    }
    const turretPull = pF.hasTurretHeal() && turrets.length > 0;
    const turretAggro = turretPull ? pF.getTurretAggroRadius() : 0;

    for (let i = drops.length - 1; i >= 0; i--) {
      const g = drops[i];
      g.t += dt;

      // initial drift fades
      g.vx *= dampFast;
      g.vy *= dampFast;
      g.x += g.vx * dt;
      g.y += g.vy * dt;

      const dx = player.x - g.x;
      const dy = player.y - g.y;
      const dist = len2(dx, dy) || 1;

      let targetMagnet = player.magnet;
      let useNova = false;
      let useTurret = false;
      if (novaBulletsThisFrame.length){
        for (const b of novaBulletsThisFrame){
          const ndx = b.x - g.x;
          const ndy = b.y - g.y;
          if ((ndx*ndx + ndy*ndy) <= novaMagnetR * novaMagnetR){
            g.novaPull = true;
            break;
          }
        }
      }
      if (g.novaPull) useNova = true;
      if (turretPull && g.kind === "xp"){
        if (!g.turretPull){
          for (const t of turrets){
            const tdx = t.x - g.x;
            const tdy = t.y - g.y;
            if ((tdx*tdx + tdy*tdy) <= turretAggro * turretAggro){
              g.turretPull = true;
              break;
            }
          }
        }
        if (g.turretPull) useTurret = true;
      }
      if (useNova) targetMagnet = Math.max(targetMagnet, dist + 1);
      if (useTurret) targetMagnet = Math.max(targetMagnet, turretAggro * 4);

      if (dist < targetMagnet) {
        const pull = (1 - dist / targetMagnet);
        const boost = (useNova || useTurret);
        const speed = (boost ? 340 : 240) + (boost ? 680 : 520) * pull;
        g.x += (dx / dist) * speed * dt;
        g.y += (dy / dist) * speed * dt;
      }

      if (dist < player.r + g.r + 6) {
        if (g.kind === "heal") queueHeal(g.v);
        else gainXp(g.v);
        drops.splice(i, 1);
      } else if (g.t > (g.life || 36)) {
        drops.splice(i, 1);
      }
    }
  }

  return updateDrops;
}
