import { DASH_TRAIL_INTERVAL } from "../../content/config.js";

export function createEffectUpdates({
  state,
  dashTrail,
  lightningStrikes,
  particles,
  shockwaves,
  floaters,
}) {

  function updateDashTrail(dt, spawnDashTrail) {
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

  function updateParticles(dt, dampSlow) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.t += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= dampSlow;
      p.vy *= dampSlow;
      if (p.t >= p.life) particles.splice(i, 1);
    }
  }

  function updateShockwaves(dt) {
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const s = shockwaves[i];
      s.t += dt;
      if (s.t >= s.life) shockwaves.splice(i, 1);
    }
  }

  function updateFloaters(dt, dampSlow) {
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.t += dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vx *= dampSlow;
      f.vy *= dampSlow;
      if (f.t >= f.life) floaters.splice(i, 1);
    }
  }

  return {
    updateDashTrail,
    updateLightning,
    updateParticles,
    updateShockwaves,
    updateFloaters,
  };
}
