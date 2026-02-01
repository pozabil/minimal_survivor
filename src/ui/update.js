import { createBossUI } from "./updates/bosses.js";
import { createTotemTimerUI, createTotemWarningUI } from "./updates/totem.js";
import { createInfoUI } from "./updates/info.js";
import { createTimersUI } from "./updates/timers.js";
import { createPlayerBarsUI } from "./updates/player_bars.js";
import { createActiveItemsUI } from "./updates/active_items.js";
import { HUD_UPDATE_TIME } from "../core/constants.js";

export function createUpdateUi({ hudElements, overlayElements }) {
  const updateBossUI = createBossUI({ elements: hudElements });
  const updateTotemTimer = createTotemTimerUI({ elements: hudElements });
  const updateTotemWarning = createTotemWarningUI({ elements: hudElements });
  const { updateInfo, forceUpdateRerollsUI } = createInfoUI({ elements: hudElements });
  const updateTimers = createTimersUI({ elements: hudElements });
  const { updatePlayerBars, forceUpdatePlayerHpBar } = createPlayerBarsUI({ elements: hudElements });
  const updateActiveItems = createActiveItemsUI({ hudElements, overlayElements });

  let hudUpdateAcc = HUD_UPDATE_TIME;

  function updateUI({
    dtRaw,
    player,
    state,
    entities,
    getDps,
    getTurretLevel,
    spawn,
    getTotemLife,
    getTotemInterval,
    getChestInterval,
    hasUnique,
    hasAnyActionSkill,
    isTouch,
    uniques,
  }) {
    hudUpdateAcc += dtRaw;
    if (hudUpdateAcc < HUD_UPDATE_TIME) return;
    hudUpdateAcc = 0;

    const { enemies, bullets, enemyBullets, chests, totem } = entities;
    updateBossUI(enemies);

    updateInfo({ player, state, getDps, getTurretLevel });
    updateTotemTimer(totem);
    updateTotemWarning(totem);

    updatePlayerBars({ player, state });

    updateTimers({
      totem,
      state,
      spawn,
      chests,
      getTotemLife,
      getTotemInterval,
      getChestInterval,
    });

    updateActiveItems({
      player,
      state,
      hasUnique,
      hasAnyActionSkill,
      isTouch,
      uniques,
    });
  }

  return {
    updateUI,
    forceUpdateRerollsUI,
    forceUpdatePlayerHpBar,
  };
}
