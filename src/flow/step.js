import { clamp } from "../utils/math.js";
import {
  LOW_HP_SLOW_THRESHOLD,
  LOW_HP_SLOW_DURATION,
  LOW_HP_SLOW_COOLDOWN,
  LOW_HP_SLOW_RESET,
  LOW_HP_SLOW_SCALE,
} from "../content/config.js";
import { MAX_SHIRT_SLOW_SCALE } from "../content/uniques.js";

export function createStep({
  state,
  player,
  entities,
  profiler,
  update,
  realtimeUpdate,
  render,
}){
  function measureMs(fn){
    const start = performance.now();
    fn();
    return performance.now() - start;
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

    // update
    let updateMs = 0; if (!state.paused && !state.dead){ updateMs = measureMs(() => update(dt)); }
    // realtimeUpdate
    let rUpdateMs = 0; if (!state.paused && !state.dead){ rUpdateMs = measureMs(() => realtimeUpdate(dtRaw)); }
    // render
    const renderMs = measureMs(render);
    // profiler
    if (profiler.isEnabled){
      let profilerMs = 0;
      profilerMs = measureMs(() => profiler.updateProfiler(now, dtRaw, updateMs, rUpdateMs, renderMs, entities));
      profiler.updateProfilerMs(now, profilerMs);
    }
  };
}
