import { randi } from "../../utils/rand.js";

export function createTryConsumeSpareTire({
  pF,
  player,
  spawnBurst,
  pauseMenu,
  updateBuildUI,
}) {
  return function tryConsumeSpareTire() {
    if (!pF.hasUnique("spare_tire")) return false;
    player.uniques.delete("spare_tire");
    const reviveHp = Math.max(1, Math.ceil(player.hpMax * 0.25));
    player.hp = reviveHp;
    player.invuln = Math.max(player.invuln, 1.2);
    spawnBurst(player.x, player.y, randi(14, 18), 240, 0.45);
    if (pauseMenu.style.display === "grid") updateBuildUI();
    return true;
  };
}
