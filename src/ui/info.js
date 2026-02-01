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
  } = elements;

  function updateInfo({ player, state, enemies, bullets, enemyBullets, dpsNow }) {
    elLvl.textContent = `Lv ${player.lvl}`;
    elKills.textContent = `Kills ${state.kills}`;
    let alive = 0;
    for (const e of enemies) if (!e.dead) alive += 1;
    elEnemiesCount.textContent = `Enemies ${alive}`;
    elShots.textContent = `Bullets ${bullets.length + enemyBullets.length}`;
    elDps.textContent = `Dmg ${dpsNow}`;
    if (dpsNow > state.maxDps) state.maxDps = dpsNow;
    elTime.textContent = fmtTime(state.t);
  }

  return updateInfo;
}
