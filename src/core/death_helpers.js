import { updateRecordsOnDeath } from "../systems/storage.js";

export function createDeathHelpers({
  state,
  player,
  menus,
  forceUpdatePlayerHpBar,
  tryConsumeSpareTire,
}) {
  function setDeathReason(reason){
    if (!state.deathReason) state.deathReason = reason;
  }

  function enemyLabel(type, bossKind){
    if (type === "boss" && bossKind) return `boss:${bossKind}`;
    return type || "enemy";
  }

  function formatDeathReason(kind, type, bossKind){
    const label = enemyLabel(type, bossKind);
    return kind ? `${kind} ${label}` : label;
  }

  function handlePlayerDeath(reason){
    if (tryConsumeSpareTire()) return false;
    forceUpdatePlayerHpBar({ player, state });
    player.hp = 0;
    state.dead = true;
    updateRecordsOnDeath({ state, player });
    if (reason) setDeathReason(reason);
    menus.gameOver();
    return true;
  }

  return {
    formatDeathReason,
    handlePlayerDeath,
  };
}
