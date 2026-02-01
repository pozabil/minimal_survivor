import { BOSS_NAME } from "../content/enemies.js";
import { clamp } from "../utils/math.js";

export function createBossUI({ elements }) {
  const { elBossWrap, elBossList } = elements;
  const bossRows = [];
  const wrapState = { visible: null };

  function setIfChanged(obj, key, value, apply){
    if (obj[key] === value) return;
    obj[key] = value;
    apply(value);
  }

  function setRowVisible(row, visible){
    setIfChanged(row, "lastVisible", visible, (v)=>{ row.el.style.display = v ? "" : "none"; });
  }

  function setWrapVisible(visible){
    setIfChanged(wrapState, "visible", visible, (v)=>{ elBossWrap.style.display = v ? "block" : "none"; });
  }

  function ensureBossRows(n){
    while (bossRows.length < n){
      const row = document.createElement("div");
      row.className = "bossRow";

      const name = document.createElement("div");
      name.className = "bossName";

      const bar = document.createElement("div");
      bar.className = "bar bossHp";

      const fill = document.createElement("div");
      fill.className = "fill";

      bar.appendChild(fill);
      row.appendChild(name);
      row.appendChild(bar);
      elBossList.appendChild(row);

      bossRows.push({
        el: row,
        name,
        fill,
        lastVisible: false,
        lastText: "",
        lastWidth: "",
      });
    }
  }

  function hideUnusedRows(startIndex){
    for (let i=startIndex; i<bossRows.length; i++){
      const row = bossRows[i];
      setRowVisible(row, false);
    }
  }

  function updateBossUI(enemies){
    const bosses = [];
    for (const e of enemies){
      if (e.type === "boss" && !e.dead) bosses.push(e);
    }
    const wrapVisible = bosses.length > 0;
    setWrapVisible(wrapVisible);
    if (!wrapVisible){
      hideUnusedRows(0);
      return;
    }
    ensureBossRows(bosses.length);
    for (let i=0; i<bosses.length; i++){
      const b = bosses[i];
      const name = BOSS_NAME[b.bossKind] || "Boss";
      const tier = (b.bossTier || 0) + 1;
      const hpPct = clamp(b.hp / b.hpMax, 0, 1);
      const row = bossRows[i];
      setRowVisible(row, true);
      const text = `BOSS: ${name} (T${tier})`;
      setIfChanged(row, "lastText", text, (v)=>{ row.name.textContent = v; });
      const width = `${(hpPct*100).toFixed(2)}%`;
      setIfChanged(row, "lastWidth", width, (v)=>{ row.fill.style.width = v; });
    }
    hideUnusedRows(bosses.length);
  }

  return updateBossUI;
}
