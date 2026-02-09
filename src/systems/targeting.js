import { TAU } from "../core/constants.js";

export function createTargeting({ enemies, gridQueryCircle }) {
  const nearestCandidates = [];
  const ricochetCandidates = [];
  const ricochetAngleCandidates = [];

  function findNearestEnemyFrom(x, y) {
    let best = null;
    let bestD = Infinity;
    for (const e of enemies) {
      if (e.dead || e.dying) continue;
      if (e.type === "boss") {
        const d = (e.x - x) ** 2 + (e.y - y) ** 2;
        if (d < bestD * 1.1) { bestD = d; best = e; }
      }
    }
    for (const e of enemies) {
      if (e.dead || e.dying) continue;
      if (e.type === "boss") continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  function findNearestEnemyTo(x, y, range) {
    gridQueryCircle(x, y, range, nearestCandidates);
    let best = null;
    let bestD = Infinity;
    for (const e of nearestCandidates) {
      if (e.dead || e.dying) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  function findRicochetTarget(x, y, excludeId, excludeId2) {
    gridQueryCircle(x, y, 260, ricochetCandidates);
    let best = null;
    let bestD = Infinity;
    for (const e of ricochetCandidates) {
      if (e.dead || e.dying) continue;
      if (e.id === excludeId || e.id === excludeId2) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  function findRicochetTargetWithinAngle(x, y, excludeId, excludeId2, excludeId3, baseAng, maxDelta) {
    gridQueryCircle(x, y, 260, ricochetAngleCandidates);
    let best = null;
    let bestD = Infinity;
    for (const e of ricochetAngleCandidates) {
      if (e.dead || e.dying) continue;
      if (e.id === excludeId || e.id === excludeId2 || e.id === excludeId3) continue;
      const ang = Math.atan2(e.y - y, e.x - x);
      let dAng = Math.abs(ang - baseAng) % TAU;
      if (dAng > Math.PI) dAng = TAU - dAng;
      if (dAng > maxDelta) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  return {
    findNearestEnemyFrom,
    findNearestEnemyTo,
    findRicochetTarget,
    findRicochetTargetWithinAngle,
  };
}
