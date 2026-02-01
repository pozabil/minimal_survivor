import { clamp } from "../utils/math.js";

export function createTimersUI({ elements }) {
  const {
    totemBar,
    totemText,
    bossBar,
    bossText,
    chestBar,
    chestText,
  } = elements;

  function updateTimers({
    totem,
    state,
    spawn,
    chests,
    getTotemLife,
    getTotemInterval,
    getChestInterval,
  }) {
    const totemLeft = totem.active ? totem.life : state.totemTimer;
    const totemMax = totem.active
      ? (totem.lifeMax || getTotemLife())
      : (state.totemTimerMax || getTotemInterval());
    const totemPct = clamp(totemLeft / Math.max(1, totemMax), 0, 1);
    totemBar.style.width = `${totemPct*100}%`;
    totemText.textContent = `${Math.max(0, Math.ceil(totemLeft))}s`;

    const bossLeft = Math.max(0, spawn.nextBossAt - state.t);
    const bossMax = Math.max(1, spawn.bossEvery || 1);
    const bossPct = clamp(bossLeft / bossMax, 0, 1);
    bossBar.style.width = `${bossPct*100}%`;
    bossText.textContent = `${Math.max(0, Math.ceil(bossLeft))}s`;

    if (state.chestAlive){
      chestBar.style.width = "100%";
      chestText.textContent = chests.length ? "ON MAP" : "SPAWNING…";
    } else {
      const chestLeft = Math.max(0, state.chestTimer);
      const chestMax = Math.max(1, getChestInterval());
      const chestPct = clamp(chestLeft / chestMax, 0, 1);
      chestBar.style.width = `${chestPct*100}%`;
      chestText.textContent = `${Math.max(0, Math.ceil(chestLeft))}s`;
    }
  }

  return updateTimers;
}
