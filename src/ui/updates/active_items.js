import { clamp } from "../../utils/math.js";
import { MAX_SHIRT_COOLDOWN } from "../../content/uniques.js";

export function createActiveItemsUI({ hud, overlays }) {
  const { elActionHint, elActiveItems, elActiveItemsList } = hud;
  const { actionBar, actionBarFill } = overlays;
  let lastUniquesOrderLen = -1;
  let lastUniquesOrderTail = null;

  function updateActiveItems({ player, state, pF, isTouch, uniques }) {
    if (pF.hasUnique("max_shirt")){
      actionBar.style.display = "block";
      const pct = clamp(1 - (state.maxShirtCd / MAX_SHIRT_COOLDOWN), 0, 1);
      actionBarFill.style.height = `${pct*100}%`;
    } else {
      actionBar.style.display = "none";
    }

    const hasActionSkill = pF.hasAnyActionSkill();
    if (hasActionSkill){
      elActionHint.style.display = "";
      elActionHint.textContent = isTouch ? "Кнопка действия: двойной тап" : "Кнопка действия: Space";
    } else {
      elActionHint.style.display = "none";
      elActionHint.textContent = "";
    }

    const orderLen = player.uniquesOrder.length;
    const orderTail = orderLen > 0 ? player.uniquesOrder[orderLen - 1] : null;
    if (orderLen !== lastUniquesOrderLen || orderTail !== lastUniquesOrderTail){
      lastUniquesOrderLen = orderLen;
      lastUniquesOrderTail = orderTail;

      const items = [];
      for (const id of player.uniquesOrder){
        if (!player.uniques.has(id)) continue;
        const u = uniques[id];
        if (!u || !u.action) continue;
        items.push(u.title);
      }
      if (!items.length){
        elActiveItems.style.display = "none";
        elActiveItemsList.innerHTML = "";
      } else {
        elActiveItems.style.display = "block";
        elActiveItemsList.innerHTML = items.map((t)=>`<div class="item">${t}</div>`).join("");
      }
    }
  }

  return updateActiveItems;
}
