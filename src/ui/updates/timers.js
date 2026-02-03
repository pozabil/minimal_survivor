import { clamp } from "../../utils/math.js";

export function createTimersUI({ elements }) {
  const {
    elTotemBar,
    elTotemText,
    elBossBar,
    elBossText,
    elChestBar,
    elChestText,
  } = elements;

  function updateTimers({ totem, state, spawn, chests, pF }) {
    const totemLeft = totem.active ? totem.life : state.totemTimer;
    const totemMax = totem.active
      ? (totem.lifeMax || pF.getTotemLife())
      : (state.totemTimerMax || pF.getTotemInterval());
    const totemPct = clamp(totemLeft / Math.max(1, totemMax), 0, 1);
    elTotemBar.style.width = `${totemPct*100}%`;
    elTotemText.textContent = `${Math.max(0, Math.ceil(totemLeft))}s`;

    const bossLeft = Math.max(0, spawn.nextBossAt - state.t);
    const bossMax = Math.max(1, spawn.bossEvery || 1);
    const bossPct = clamp(bossLeft / bossMax, 0, 1);
    elBossBar.style.width = `${bossPct*100}%`;
    elBossText.textContent = `${Math.max(0, Math.ceil(bossLeft))}s`;

    if (state.chestAlive){
      elChestBar.style.width = "100%";
      elChestText.textContent = chests.length ? "ON MAP" : "SPAWNING…";
    } else {
      const chestLeft = Math.max(0, state.chestTimer);
      const chestMax = Math.max(1, pF.getChestInterval());
      const chestPct = clamp(chestLeft / chestMax, 0, 1);
      elChestBar.style.width = `${chestPct*100}%`;
      elChestText.textContent = `${Math.max(0, Math.ceil(chestLeft))}s`;
    }
  }

  return updateTimers;
}
