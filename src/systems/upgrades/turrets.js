export function createTurretSystem({ player, pF, turrets, shooting }) {
  function getEnemyTarget(e) {
    if (e.type === "boss") return { x: player.x, y: player.y, turret: null };
    const aggro = pF.getTurretAggroRadius();
    let best = null;
    let bestD = Infinity;
    if (aggro > 0) {
      const aggro2 = aggro * aggro;
      for (const t of turrets) {
        const dx = t.x - e.x;
        const dy = t.y - e.y;
        const d = dx * dx + dy * dy;
        if (d <= aggro2 && d < bestD) {
          bestD = d;
          best = t;
        }
      }
    }
    if (best) return { x: best.x, y: best.y, turret: best };
    return { x: player.x, y: player.y, turret: null };
  }

  function updateTurrets(dt) {
    for (let i = turrets.length - 1; i >= 0; i--) {
      const t = turrets[i];
      const size = pF.getTurretSize();
      const hpMax = pF.getTurretHpMax();
      t.size = size;
      t.r = size * 0.5;
      if (t.hpMax !== hpMax) {
        const delta = hpMax - t.hpMax;
        t.hpMax = hpMax;
        t.hp = Math.min(hpMax, t.hp + delta);
      }
      t.hitCd = Math.max(0, t.hitCd - dt);
      if (t.hp <= 0) {
        turrets.splice(i, 1);
        continue;
      }

      shooting.tryFireTurret(t, dt);
    }
  }

  return {
    getEnemyTarget,
    updateTurrets,
  };
}
