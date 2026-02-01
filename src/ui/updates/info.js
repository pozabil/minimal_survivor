import { fmtTime } from "../../utils/format.js";

export function createInfoUI({
  elements,
}) {
  const {
    elTime,
    elLvl,
    elKills,
    elDps,
    elWep,
    elRerolls,
    elThreat,
  } = elements;

  function updateInfo({ player, state, getDps, getTurretLevel }) {
    const dpsNow = getDps();
    elLvl.textContent = `Lv ${player.lvl}`;
    elKills.textContent = `Kills ${state.kills}`;
    elDps.textContent = `DPS ${dpsNow}`;
    if (dpsNow > state.maxDps) state.maxDps = dpsNow;
    elTime.textContent = fmtTime(state.t);
    elWep.textContent = "W: Bullets"
      + (player.orbitals>0?` + Orbit x${player.orbitals}`:"")
      + (player.aura?" + Aura":"")
      + (player.novaCount>0?` + Nova x${player.novaCount * 3}`:"")
      + (getTurretLevel()>0?` + Turret L${getTurretLevel()}`:"");
    elRerolls.textContent = `Reroll ${player.rerolls}`;
    elThreat.textContent = `Threat ${state.difficulty.toFixed(1)}`;
  }

  function forceUpdateRerollsUI({ player }) {
    elRerolls.textContent = `Reroll ${player.rerolls}`;
  }

  return { updateInfo, forceUpdateRerollsUI };
}
