import { fmtTime } from "../utils/format.js";

export function createInfoUI({
  elements,
}) {
  const {
    elTime,
    elLvl,
    elKills,
    elEnemiesCount,
    elShots,
    elDps,
    elWep,
    elRerolls,
    elThreat,
  } = elements;

  function updateInfo({ player, state, enemies, bullets, enemyBullets, getDps, getTurretLevel }) {
    const dpsNow = getDps();
    elLvl.textContent = `Lv ${player.lvl}`;
    elKills.textContent = `Kills ${state.kills}`;
    let alive = 0;
    for (const e of enemies) if (!e.dead) alive += 1;
    elEnemiesCount.textContent = `Enemies ${alive}`;
    elShots.textContent = `Bullets ${bullets.length + enemyBullets.length}`;
    elDps.textContent = `Dmg ${dpsNow}`;
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
