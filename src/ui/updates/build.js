import { fmtTime, fmtPct, fmtNum, fmtSignedPct } from "../../utils/format.js";
import { DPS_WINDOW_SEC } from "../../core/constants.js";

export function createBuildUI({
  elements,
  player,
  state,
  ui,
  pF,
  UNIQUES,
  UPGRADES,
  getDps,
}) {
  const {
    buildListEl,
    invListEl,
    buildStatsEl,
    btnHang,
    tabUpgrades,
    tabInventory,
  } = elements;

  function setBuildTab(tab){
    ui.buildTab = tab;
    tabUpgrades.classList.toggle("active", tab === "upgrades");
    tabInventory.classList.toggle("active", tab === "inventory");
    buildListEl.style.display = tab === "upgrades" ? "flex" : "none";
    invListEl.style.display = tab === "inventory" ? "flex" : "none";
  }

  function getBuildEffectText(id){
    switch (id){
      case "fireRate":
        return `Скорость атаки: ${fmtNum(player.fireRate, 2)}/с`;
      case "damage":
        return `Урон пули: ${fmtNum(player.damage)}`;
      case "pierce":
        return `Пробитий: ${Math.max(0, player.pierce - 1)}`;
      case "multishot":
        return `Снарядов за выстрел: ${player.multishot}`;
      case "nova":
        return `Нова: ${player.novaCount * 3} снарядов`;
      case "novaDamage":
        return `Нова: урон ${fmtNum(player.novaDamage)}`;
      case "novaRate":
        return `Нова: ${fmtNum(player.novaRate, 2)}/с`;
      case "novaSpeed":
        return `Нова: скорость ${fmtNum(player.novaSpeed)}`;
      case "novaMagnet":
        return `Нова: радиус магнита ${fmtNum(pF.getNovaMagnetRadius())}`;
      case "turret":
        return `Турели: ${fmtPct(pF.getTurretChance())} шанс · макс ${pF.getTurretMax()} · агро ${fmtNum(pF.getTurretAggroRadius())}`;
      case "turretLevel":
        return `Турели: урон ${fmtNum(pF.getTurretDamage())} · скоростр. ${fmtNum(pF.getTurretFireRate(), 2)}/с · HP ${fmtNum(pF.getTurretHpMax())}`;
      case "turretHeal":
        return `Турели: притягивают XP (радиус ${fmtNum(pF.getTurretAggroRadius())})`;
      case "bulletSpeed":
        return `Скорость пули: ${fmtNum(player.bulletSpeed)}`;
      case "crit":
        return `Крит шанс: ${fmtPct(player.critChance)}`;
      case "bulletSize":
        return `Размер пули: ${fmtNum(player.bulletSize, 1)}`;
      case "critMultUp":
        return `Крит множ.: x${fmtNum(player.critMult, 2)}`;
      case "ricochetChance":
        return `Рикошет: шанс ${fmtPct(player.ricochetChance)}`;
      case "ricochetBounces":
        return `Рикошет: отскоков ${pF.getRicochetBounces()}`;
      case "armor":
        return `Броня: ${fmtPct(player.armor)}`;
      case "dodge":
        return `Уклонение: ${fmtPct(player.dodge)}`;
      case "lifesteal":
        return `Лайфстил: ${fmtPct(player.lifeSteal * 0.01)} шанс на 1% HP при попадании`;
      case "xpGain": {
        const bonus = player.xpGainMult - 1;
        return `Опыт: x${fmtNum(player.xpGainMult, 2)} (${fmtSignedPct(bonus)})`;
      }
      case "rerollCap":
        return `Лимит reroll: ${player.rerollCap}`;
      case "orbitalSpeedUp":
        return `Орбиталки: скорость ${fmtNum(player.orbitalSpeed, 2)}`;
      case "auraSlow":
        return `Аура: замедление ${fmtPct(player.auraSlow)}`;
      case "auraWave":
        return `Аура: волна ${fmtNum(pF.getAuraWaveCooldown(), 1)}с · сила ${fmtNum(pF.getAuraWaveForce())}`;
      case "speed":
        return `Скорость: ${fmtNum(pF.getMoveSpeed())}`;
      case "hp":
        return `HP max: ${fmtNum(player.hpMax)}`;
      case "regen":
        return `Реген: ${fmtNum(player.regen, 1)} HP/с`;
      case "magnet":
        return `Магнит: ${fmtNum(player.magnet)}`;
      case "orbital":
        return `Орбиталок: ${player.orbitals}`;
      case "orbitalDmg":
        return `Орбиталки: урон ${fmtNum(player.orbitalDamage)}`;
      case "orbitalRadius":
        return `Орбиталки: радиус ${fmtNum(player.orbitalRadius)}`;
      case "aura":
        return "Аура: активна";
      case "auraRadius":
        return `Аура: радиус ${fmtNum(player.auraRadius)}`;
      case "auraDps":
        return `Аура: DPS ${fmtNum(player.auraDps)}`;
      case "dog":
        return `Питомец: урон ${fmtNum(player.damage)}`;
      default:
        return "";
    }
  }

  function updateInventoryUI(){
    invListEl.innerHTML = "";
    const ids = player.uniquesOrder.filter((id)=>player.uniques.has(id));
    if (!ids.length){
      invListEl.innerHTML = `<div class="small" style="opacity:.8">Пока нет уникальных предметов.</div>`;
      return;
    }
    for (const id of ids){
      const item = UNIQUES[id];
      if (!item) continue;
      const row = document.createElement("div");
      row.className = "item invItem";
      row.innerHTML = `
        <div class="invHead">
          <div class="k">${item.title}</div>
          <span class="pill ${item.rarity}">${item.rarity.toUpperCase()}</span>
        </div>
        <div class="invDesc">${item.desc}</div>
      `;
      invListEl.appendChild(row);
    }
  }

  function updateBuildUI(){
    const entries = Object.keys(player.upgrades)
      .map(id => ({ id, lv: player.upgrades[id] }))
      .sort((a,b)=> (UPGRADES[a.id]?.title || a.id).localeCompare(UPGRADES[b.id]?.title || b.id));
    const titleOf = (id)=>UPGRADES[id]?.title || id;

    buildListEl.innerHTML = "";
    if (!entries.length){
      buildListEl.innerHTML = `<div class="small" style="opacity:.8">Пока нет апгрейдов. Подбирай XP и сундуки.</div>`;
    } else {
      const buildGroups = [
        { id:"ricochet", title:"Рикошет", items:["ricochetChance","ricochetBounces"] },
        { id:"nova", title:"Нова", items:["nova","novaDamage","novaRate","novaSpeed","novaMagnet"] },
        { id:"orbital", title:"Орбиталки", items:["orbital","orbitalDmg","orbitalRadius","orbitalSpeedUp"] },
        { id:"aura", title:"Аура", items:["aura","auraRadius","auraDps","auraSlow","auraWave"] },
        { id:"turret", title:"Турели", items:["turret","turretLevel","turretHeal"] },
        { id:"shooting", title:"Стрельба", items:["fireRate","damage","pierce","multishot","bulletSpeed","bulletSize","crit","critMultUp"] },
        { id:"general", title:"Общие", items:[] },
      ];
      const entriesById = new Map(entries.map((e)=>[e.id, e]));
      const used = new Set();
      const makeEntryRow = (e)=>{
        const title = titleOf(e.id);
        const max = UPGRADES[e.id]?.max ?? "?";
        const row = document.createElement("div");
        row.className = "item";
        row.style.cursor = "pointer";
        row.style.flexDirection = "column";
        row.style.gap = "6px";

        const head = document.createElement("div");
        head.style.display = "flex";
        head.style.justifyContent = "space-between";
        head.style.gap = "10px";
        head.innerHTML = `<div class="k">${title}</div><div class="v">Lv ${e.lv}/${max}</div>`;

        const desc = getBuildEffectText(e.id);
        const descEl = document.createElement("div");
        descEl.className = "small";
        descEl.style.display = "none";
        descEl.style.opacity = "0.85";
        descEl.textContent = desc;

        row.addEventListener("click", ()=>{
          descEl.style.display = (descEl.style.display === "none") ? "block" : "none";
        });

        row.appendChild(head);
        row.appendChild(descEl);
        return row;
      };

      for (const group of buildGroups){
        let groupEntries = [];
        if (group.id === "general"){
          groupEntries = entries.filter((e)=>!used.has(e.id));
        } else {
          for (const id of group.items){
            const entry = entriesById.get(id);
            if (entry) groupEntries.push(entry);
          }
          for (const e of groupEntries) used.add(e.id);
        }
        if (!groupEntries.length) continue;

        groupEntries.sort((a,b)=> titleOf(a.id).localeCompare(titleOf(b.id)));

        const groupWrap = document.createElement("div");
        groupWrap.className = "buildGroup";

        const head = document.createElement("div");
        head.className = "item buildGroupHead";
        head.innerHTML = `<div class="label"><span class="arrow">▶</span><span class="k">${group.title}</span></div><div class="v">${groupEntries.length}</div>`;
        head.addEventListener("click", ()=>{
          groupWrap.classList.toggle("open");
        });

        const list = document.createElement("div");
        list.className = "buildGroupList";
        for (const e of groupEntries){
          list.appendChild(makeEntryRow(e));
        }

        groupWrap.appendChild(head);
        groupWrap.appendChild(list);
        buildListEl.appendChild(groupWrap);
      }
    }

    updateInventoryUI();
    setBuildTab(ui.buildTab || "upgrades");
    btnHang.style.display = pF.hasUnique("rope") ? "inline-flex" : "none";

    const wparts = [];
    wparts.push("Bullets");
    if (player.orbitals>0) wparts.push(`Orbit x${player.orbitals}`);
    if (player.aura) wparts.push("Aura");
    if (player.novaCount>0) wparts.push(`Nova x${player.novaCount * 3}`);
    if (pF.getTurretLevel()>0) wparts.push(`Turret L${pF.getTurretLevel()}`);

    buildStatsEl.innerHTML = `
      <div class="item"><div class="k">Hero</div><div class="v">${player.heroName}</div></div>
      <div class="small" style="opacity:.78; margin:6px 0 10px;">${player.heroPerkText}</div>
      <div class="item"><div class="k">Time</div><div class="v">${fmtTime(state.t)}</div></div>
      <div class="item"><div class="k">Level</div><div class="v">${player.lvl}</div></div>
      <div class="item"><div class="k">Kills</div><div class="v">${state.kills}</div></div>
      <div class="item"><div class="k">DPS (${DPS_WINDOW_SEC}s)</div><div class="v">${getDps()}</div></div>
      <div class="item"><div class="k">HP</div><div class="v">${Math.ceil(player.hp)} / ${player.hpMax}</div></div>
      <div class="item"><div class="k">Speed</div><div class="v">${Math.round(pF.getMoveSpeed())}</div></div>
      <div class="item"><div class="k">Rerolls</div><div class="v">${player.rerolls}</div></div>
      <div class="item"><div class="k">Weapons</div><div class="v">${wparts.join(" + ")}</div></div>
    `;
  }

  return {
    updateBuildUI,
    setBuildTab,
  };
}
