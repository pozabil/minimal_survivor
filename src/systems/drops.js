import { len2 } from "../utils/math.js";

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
