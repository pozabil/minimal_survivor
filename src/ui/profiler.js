import { HUD_UPDATE_TIME_MS } from "../core/constants.js";

export function createProfilerUI({ root = document } = {}) {
  const elProfiler = root.getElementById("profiler");
  const elProfilerFps = root.getElementById("profilerFps");
  const elProfilerFpsMax = root.getElementById("profilerFpsMax");
  const elProfilerFrame = root.getElementById("profilerFrame");
  const elProfilerFrameMax = root.getElementById("profilerFrameMax");
  const elProfilerP95 = root.getElementById("profilerP95");
  const elProfilerP95Max = root.getElementById("profilerP95Max");
  const elProfilerP99 = root.getElementById("profilerP99");
  const elProfilerP99Max = root.getElementById("profilerP99Max");
  const elProfilerLow1 = root.getElementById("profilerLow1");
  const elProfilerLow1Max = root.getElementById("profilerLow1Max");
  const elProfilerJank = root.getElementById("profilerJank");
  const elProfilerJankMax = root.getElementById("profilerJankMax");
  const elProfilerDrops = root.getElementById("profilerDrops");
  const elProfilerDropsMax = root.getElementById("profilerDropsMax");
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
  let minFps = Infinity;
  let maxFrame = 0;
  let maxP95 = 0;
  let maxP99 = 0;
  let minLow1 = Infinity;
  let maxJank = 0;
  let maxDrops = 0;
  let maxUpdate = 0;
  let maxRealtime = 0;
  let maxRender = 0;
  let maxEnemies = 0;
  let maxBullets = 0;
  let accProfiler = 0;
  let profilerFrames = 0;
  let lastProfilerTime = 0;
  let maxProfiler = 0;
  const frameTimes = [];
  const FRAME_PACE_SAMPLES = 240;
  const JANK_THRESHOLD_MS = (1000 / 60) * 1.01;

  function updateProfiler(now, dtRaw, updateMs, rUpdateMs, renderMs, entities) {
    const { enemies, bullets, enemyBullets, drops } = entities;
    let alive = 0;
    for (const e of enemies) if (!e.dead) alive += 1;
    elProfilerEnemies.textContent = String(alive);
    const bulletsCount = bullets.length + enemyBullets.length;
    elProfilerBullets.textContent = String(bulletsCount);
    const dropsCount = drops.length;
    elProfilerDrops.textContent = String(dropsCount);
    if (alive > maxEnemies) {
      maxEnemies = alive;
      elProfilerEnemiesMax.textContent = String(maxEnemies);
    }
    if (bulletsCount > maxBullets) {
      maxBullets = bulletsCount;
      elProfilerBulletsMax.textContent = String(maxBullets);
    }
    if (dropsCount > maxDrops) {
      maxDrops = dropsCount;
      elProfilerDropsMax.textContent = String(maxDrops);
    }
    const dtMs = dtRaw * 1000;
    frameTimes.push(dtMs);
    if (frameTimes.length > FRAME_PACE_SAMPLES) frameTimes.shift();
    accTime += dtRaw;
    frames += 1;
    accUpdate += updateMs;
    accRealtime += rUpdateMs;
    accRender += renderMs;
    if (now - lastTime > HUD_UPDATE_TIME_MS) {
      const denom = Math.max(1, frames);
      const sampleCount = frameTimes.length;
      const samples = sampleCount > 0 ? frameTimes.slice() : [0];
      samples.sort((a, b) => a - b);
      const p95 = samples[Math.floor((samples.length - 1) * 0.95)];
      const p99 = samples[Math.floor((samples.length - 1) * 0.99)];
      const low1 = p99 > 0 ? (1000 / p99) : 0;
      let jank = 0;
      for (const t of frameTimes) if (t > JANK_THRESHOLD_MS) jank += 1;
      const fps = accTime > 0 ? (frames / accTime) : 0;
      const frameMs = (accTime / denom) * 1000;
      const updateAvg = accUpdate / denom;
      const realtimeAvg = accRealtime / denom;
      const renderAvg = accRender / denom;
      elProfilerFps.textContent = fps.toFixed(0);
      elProfilerFrame.textContent = frameMs.toFixed(1);
      elProfilerP95.textContent = p95.toFixed(1);
      elProfilerP99.textContent = p99.toFixed(1);
      elProfilerLow1.textContent = low1.toFixed(1);
      elProfilerJank.textContent = String(jank);
      elProfilerUpdate.textContent = updateAvg.toFixed(2);
      elProfilerRealtime.textContent = realtimeAvg.toFixed(2);
      elProfilerRender.textContent = renderAvg.toFixed(2);
      if (fps < minFps) {
        minFps = fps;
        elProfilerFpsMax.textContent = minFps.toFixed(0);
      }
      if (frameMs > maxFrame) {
        maxFrame = frameMs;
        elProfilerFrameMax.textContent = maxFrame.toFixed(1);
      }
      if (p95 > maxP95) {
        maxP95 = p95;
        elProfilerP95Max.textContent = maxP95.toFixed(1);
      }
      if (p99 > maxP99) {
        maxP99 = p99;
        elProfilerP99Max.textContent = maxP99.toFixed(1);
      }
      if (low1 < minLow1) {
        minLow1 = low1;
        elProfilerLow1Max.textContent = minLow1.toFixed(1);
      }
      if (jank > maxJank) {
        maxJank = jank;
        elProfilerJankMax.textContent = String(maxJank);
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

  function updateProfilerMs(now, profilerMs) {
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
