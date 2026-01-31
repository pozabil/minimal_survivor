import { DASH_TRAIL_INTERVAL } from "../../content/config.js";

export function createEffectUpdates({
  state,
  player,
  dashTrail,
  lightningStrikes,
  spawnDashTrail,
}) {

  function updateDashTrail(dt) {
    for (let i = dashTrail.length - 1; i >= 0; i--) {
      const d = dashTrail[i];
      d.t += dt;
      if (d.t >= d.life) dashTrail.splice(i, 1);
    }
    if (state.dashT > 0) {
      state.dashTrailT += dt;
      while (state.dashTrailT >= DASH_TRAIL_INTERVAL) {
        state.dashTrailT -= DASH_TRAIL_INTERVAL;
        spawnDashTrail();
      }
    } else {
      state.dashTrailT = 0;
    }
  }

  function updateLightning(dt) {
    for (let i = lightningStrikes.length - 1; i >= 0; i--) {
      const s = lightningStrikes[i];
      s.t += dt;
      if (s.t >= s.life) lightningStrikes.splice(i, 1);
    }
  }

  return {
    updateDashTrail,
    updateLightning,
  };
}
