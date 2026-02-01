import { clamp } from "../utils/math.js";

export function createPlayerBarsUI({ elements }) {
  const {
    hpbar,
    hpbarPulse,
    hptext,
    xpbar,
    xptext,
  } = elements;

  function updatePlayerBars({ player, state }) {
    const hpPct = clamp(player.hp / player.hpMax, 0, 1);
    hpbar.style.width = `${hpPct*100}%`;
    const healing = !!state.healActive || state.healQueue.length > 0;
    hpbarPulse.style.display = healing ? "block" : "none";
    if (healing) hpbarPulse.style.width = `${hpPct*100}%`;
    hptext.textContent = `${Math.ceil(player.hp)} / ${player.hpMax}`;

    xpbar.style.width = `${(player.xp/player.xpNeed)*100}%`;
    xptext.textContent = `${Math.floor(player.xp)} / ${player.xpNeed}`;
  }

  return updatePlayerBars;
}
