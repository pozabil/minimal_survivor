import { clamp } from "../../utils/math.js";

export function createPlayerBarsUI({ hud }) {
  const {
    elHpbar,
    elHpbarPulse,
    elHptext,
    elXpbar,
    elXptext,
  } = hud;

  function updateHpBar({ player, state }) {
    const hpPct = clamp(player.hp / player.hpMax, 0, 1);
    elHpbar.style.width = `${hpPct*100}%`;
    const healing = !!state.healActive || state.healQueue.length > 0;
    elHpbarPulse.style.display = healing ? "block" : "none";
    if (healing) elHpbarPulse.style.width = `${hpPct*100}%`;
    elHptext.textContent = `${Math.ceil(player.hp)} / ${player.hpMax}`;
  }

  function updatePlayerBars({ player, state }) {
    updateHpBar({ player, state });

    elXpbar.style.width = `${(player.xp/player.xpNeed)*100}%`;
    elXptext.textContent = `${Math.floor(player.xp)} / ${player.xpNeed}`;
  }

  function forceUpdatePlayerHpBar({ player, state }) {
    updateHpBar({ player, state });
  }

  return { updatePlayerBars, forceUpdatePlayerHpBar };
}
