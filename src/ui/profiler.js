import { HUD_UPDATE_TIME_MS } from "../core/constants.js";

export function createProfilerUI({ root = document } = {}) {
  const elProfiler = root.getElementById("profiler");
  const elProfilerFps = root.getElementById("profilerFps");
  const elProfilerFpsMax = root.getElementById("profilerFpsMax");
  const elProfilerFrame = root.getElementById("profilerFrame");
  const elProfilerFrameMax = root.getElementById("profilerFrameMax");
  const elProfilerUpdate = root.getElementById("profilerUpdate");
  const elProfilerUpdateMax = root.getElementById("profilerUpdateMax");
  const elProfilerRealtime = root.getElementById("profilerRealtime");
  const elProfilerRealtimeMax = root.getElementById("profilerRealtimeMax");
  const elProfilerRender = root.getElementById("profilerRender");
  const elProfilerRenderMax = root.getElementById("profilerRenderMax");
  const elProfilerEnemies = root.getElementById("profilerEnemies");
  const elProfilerEnemiesMax = root.getElementById("profilerEnemiesMax");
  const elProfilerBullets = root.getElementById("profilerBullets");
  const elProfilerBulletsMax = root.getElementById("profilerBulletsMax");
  const elProfilerSelf = root.getElementById("profilerSelf");
  const elProfilerSelfMax = root.getElementById("profilerSelfMax");

  let accTime = 0;
  let frames = 0;
  let accUpdate = 0;
  let accRealtime = 0;
  let accRender = 0;
  let lastTime = 0;
  let maxFps = 0;
  let maxFrame = 0;
  let maxUpdate = 0;
  let maxRealtime = 0;
  let maxRender = 0;
  let maxEnemies = 0;
  let maxBullets = 0;
  let accProfiler = 0;
  let profilerFrames = 0;
  let lastProfilerTime = 0;
  let maxProfiler = 0;

  function updateProfiler(now, dtRaw, updateMs, rUpdateMs, renderMs, entities) {
    const { enemies, bullets, enemyBullets } = entities;
    let alive = 0;
    for (const e of enemies) if (!e.dead) alive += 1;
    elProfilerEnemies.textContent = String(alive);
    const bulletsCount = bullets.length + enemyBullets.length;
    elProfilerBullets.textContent = String(bulletsCount);
    if (alive > maxEnemies) {
      maxEnemies = alive;
      elProfilerEnemiesMax.textContent = String(maxEnemies);
    }
    if (bulletsCount > maxBullets) {
      maxBullets = bulletsCount;
      elProfilerBulletsMax.textContent = String(maxBullets);
    }
    accTime += dtRaw;
    frames += 1;
    accUpdate += updateMs;
    accRealtime += rUpdateMs;
    accRender += renderMs;
    if (now - lastTime > HUD_UPDATE_TIME_MS) {
      const denom = Math.max(1, frames);
      const fps = accTime > 0 ? (frames / accTime) : 0;
      const frameMs = (accTime / denom) * 1000;
      const updateAvg = accUpdate / denom;
      const realtimeAvg = accRealtime / denom;
      const renderAvg = accRender / denom;
      elProfilerFps.textContent = fps.toFixed(0);
      elProfilerFrame.textContent = frameMs.toFixed(1);
      elProfilerUpdate.textContent = updateAvg.toFixed(2);
      elProfilerRealtime.textContent = realtimeAvg.toFixed(2);
      elProfilerRender.textContent = renderAvg.toFixed(2);
      if (fps > maxFps) {
        maxFps = fps;
        elProfilerFpsMax.textContent = maxFps.toFixed(0);
      }
      if (frameMs > maxFrame) {
        maxFrame = frameMs;
        elProfilerFrameMax.textContent = maxFrame.toFixed(1);
      }
      if (updateAvg > maxUpdate) {
        maxUpdate = updateAvg;
        elProfilerUpdateMax.textContent = maxUpdate.toFixed(2);
      }
      if (realtimeAvg > maxRealtime) {
        maxRealtime = realtimeAvg;
        elProfilerRealtimeMax.textContent = maxRealtime.toFixed(2);
      }
      if (renderAvg > maxRender) {
        maxRender = renderAvg;
        elProfilerRenderMax.textContent = maxRender.toFixed(2);
      }
      accTime = 0;
      frames = 0;
      accUpdate = 0;
      accRealtime = 0;
      accRender = 0;
      lastTime = now;
    }
  }

  function updateProfilerMs(now, _dtRaw, _updateMs, profilerMs) {
    accProfiler += profilerMs;
    profilerFrames += 1;
    if (now - lastProfilerTime > HUD_UPDATE_TIME_MS) {
      const denom = Math.max(1, profilerFrames);
      const avgProfiler = accProfiler / denom;
      elProfilerSelf.textContent = avgProfiler.toFixed(2);
      if (avgProfiler > maxProfiler) {
        maxProfiler = avgProfiler;
        elProfilerSelfMax.textContent = maxProfiler.toFixed(2);
      }
      accProfiler = 0;
      profilerFrames = 0;
      lastProfilerTime = now;
    }
  }

  const profiler = {
    elProfiler,
    isEnabled: true,
    updateProfiler,
    updateProfilerMs,
  };

  return profiler;
}
