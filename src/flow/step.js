import { clamp } from "../utils/math.js";
import { HUD_UPDATE_TIME_MS } from "../core/constants.js";
import {
  LOW_HP_SLOW_THRESHOLD,
  LOW_HP_SLOW_DURATION,
  LOW_HP_SLOW_COOLDOWN,
  LOW_HP_SLOW_RESET,
  LOW_HP_SLOW_SCALE,
  MAX_SHIRT_SLOW_SCALE,
} from "../content/config.js";

export function createStep({
  state,
  player,
  elFps,
  update,
  realtimeUpdate,
  render,
}){
  let fpsAcc = 0;
  let fpsN = 0;
  let fpsLastTime = 0;

  function updateFps(now, dtRaw){
    if (!elFps) return;
    fpsAcc += (dtRaw > 0 ? 1 / dtRaw : 0);
    fpsN++;
    if (now - fpsLastTime > HUD_UPDATE_TIME_MS){
      elFps.textContent = "FPS " + Math.round(fpsAcc / Math.max(1, fpsN));
      fpsAcc = 0;
      fpsN = 0;
      fpsLastTime = now;
    }
  }

  return function step(now, dtRaw){
    const dtBase = clamp(dtRaw, 0, 0.05);

    if (!state.paused && !state.dead){
      const hpRatio = player.hpMax > 0 ? (player.hp / player.hpMax) : 1;
      if (!state.slowMoLocked && state.slowMoCd <= 0 && hpRatio > 0 && hpRatio <= LOW_HP_SLOW_THRESHOLD){
        state.slowMoT = LOW_HP_SLOW_DURATION;
        state.slowMoCd = LOW_HP_SLOW_COOLDOWN;
        state.slowMoLocked = true;
      } else if (state.slowMoLocked && hpRatio >= LOW_HP_SLOW_RESET){
        state.slowMoLocked = false;
      }
      if (state.slowMoT > 0){
        state.slowMoT = Math.max(0, state.slowMoT - dtRaw);
      }
      if (state.slowMoCd > 0){
        state.slowMoCd = Math.max(0, state.slowMoCd - dtRaw);
      }
    }

    const slowScale = Math.min(
      state.slowMoT > 0 ? LOW_HP_SLOW_SCALE : 1,
      state.maxShirtSlowT > 0 ? MAX_SHIRT_SLOW_SCALE : 1
    );
    const dt = dtBase * slowScale;

    if (!state.paused && !state.dead) update(dt);
    updateFps(now, dtRaw);
    if (!state.paused && !state.dead) realtimeUpdate(dtRaw);
    render();
  };
}
