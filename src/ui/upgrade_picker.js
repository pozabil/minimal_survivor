import { clamp } from "../utils/math.js";
import { randi } from "../utils/rand.js";

const AURA_DEPENDENT = new Set(["auraRadius", "auraDps", "auraSlow", "auraWave"]);
const ORBITAL_DEPENDENT = new Set(["orbitalDmg", "orbitalRadius", "orbitalSpeedUp"]);
const NOVA_DEPENDENT = new Set(["novaDamage", "novaRate", "novaSpeed", "novaMagnet"]);
const TURRET_DEPENDENT = new Set(["turretLevel", "turretHeal"]);

const WEAPONISH = new Set([
  "fireRate", "damage", "pierce", "multishot", "crit", "critMultUp", "bulletSize",
  "orbital", "orbitalDmg", "orbitalSpeedUp",
  "aura", "auraDps", "auraSlow", "auraWave",
  "nova", "novaDamage", "novaRate", "novaSpeed", "novaMagnet",
  "turret", "turretLevel", "turretHeal",
  "ricochetChance", "ricochetBounces",
  "dog",
]);

const SURVIVAL = new Set([
  "hp", "regen", "speed", "magnet", "armor", "dodge", "lifesteal", "xpGain", "rerollCap",
  "auraRadius", "orbitalRadius", "bulletSpeed",
]);

const EPIC_BOOST = new Set([
  "multishot", "pierce", "orbital", "aura", "damage", "fireRate", "critMultUp", "lifesteal",
  "nova", "novaDamage", "novaMagnet",
  "turret", "turretLevel", "turretHeal",
  "ricochetChance", "ricochetBounces",
  "dog",
]);

const COMMON_BOOST = new Set(["speed", "fireRate", "damage", "hp", "magnet"]);

export function createUpgradePicker({
  state,
  ui,
  player,
  pF,
  UPGRADES,
  UNIQUES,
  elements,
  updateBuildUI,
  forceUpdateRerollsUI,
}) {
  const {
    pauseMenu,
    pickerOverlay,
    pickerTitle,
    pickerHint,
    choicesWrap,
    btnReroll,
    btnResume,
  } = elements;

  let currentChoices = [];
  let pickerSource = "level";
  const upgradeList = Object.keys(UPGRADES);
  const uniquesList = Object.keys(UNIQUES);

  function isEligible(id){
    const maxLevel = UPGRADES[id]?.max;
    if (typeof maxLevel === "number" && pF.getLevel(id) >= maxLevel) return false;
    if (AURA_DEPENDENT.has(id) && !player.aura) return false;
    if (ORBITAL_DEPENDENT.has(id) && player.orbitals <= 0) return false;
    if (NOVA_DEPENDENT.has(id) && player.novaCount <= 0) return false;
    if (id === "ricochetBounces" && player.ricochetChance <= 0) return false;
    if (TURRET_DEPENDENT.has(id) && pF.getTurretLevel() <= 0) return false;
    return true;
  }

  function rollRarity(source){
    const epic = source === "chest" ? 0.14 : 0.06;
    let rare = source === "chest" ? 0.30 : 0.20;
    rare = clamp(rare + player.chestBonusRare, 0, 0.60);
    const r = Math.random();
    if (r < epic) return "epic";
    if (r < epic + rare) return "rare";
    return "common";
  }

  function buildChoicePool(rarity){
    const pool = [];
    for (const id of upgradeList){
      if (!isEligible(id)) continue;

      let w = 1;
      const weaponish = WEAPONISH.has(id);
      const survival = SURVIVAL.has(id);
      if (rarity === "rare"){
        w *= weaponish ? 2.2 : (survival ? 1.3 : 1.0);
      } else if (rarity === "epic"){
        w *= EPIC_BOOST.has(id) ? 3.0 : 1.1;
      } else {
        w *= COMMON_BOOST.has(id) ? 1.3 : 1.0;
      }

      const hpRatio = player.hpMax > 0 ? (player.hp / player.hpMax) : 1;
      const hasSustain = pF.getLevel("regen") > 0 || pF.getLevel("lifesteal") > 0;
      if (hpRatio < 0.20 && !hasSustain && (id === "regen" || id === "lifesteal")) w *= 2.8;
      if (hpRatio < 0.10 && id === "hp") w *= 2.6;

      const lvl = pF.getLevel(id);
      w *= 1 / (1 + lvl * 0.36);
      if (id === "orbital" && lvl > 0) w *= 1 / (1 - lvl * 0.05);
      if (id === "lifesteal" && lvl > 0) w *= 1 / (1 + lvl * 0.4);
      if (id === "dodge" && lvl > 0) w *= 1 / (1 + lvl * 0.2);
      if (id === "multishot" && lvl > 0) w *= 1 / (1 + lvl * 0.25);
      if (id === "pierce" && lvl > 0) w *= 1 / (1 + lvl * 0.28);

      pool.push([id, w]);
    }
    return pool;
  }

  function pickWeighted(pool){
    let sum = 0;
    for (const [, w] of pool) sum += w;
    let r = Math.random() * sum;
    for (const [id, w] of pool){
      r -= w;
      if (r <= 0) return id;
    }
    return pool.length ? pool[pool.length - 1][0] : null;
  }

  function buildChoices(source){
    pickerSource = source;
    currentChoices = [];
    if (source === "unique"){
      buildUniqueChoices();
      return;
    }
    for (let slot = 0; slot < 3; slot++){
      const rarity = rollRarity(source);
      const pool = buildChoicePool(rarity).filter(([id]) => !currentChoices.some((c) => c.id === id));
      if (!pool.length) break;
      const id = pickWeighted(pool);
      if (!id) break;
      currentChoices.push({ id, rarity });
    }
    while (currentChoices.length < 3){
      const pool = buildChoicePool("common").filter(([id]) => !currentChoices.some((c) => c.id === id));
      if (!pool.length) break;
      const id = pickWeighted(pool);
      currentChoices.push({ id, rarity: "common" });
    }
  }

  function buildUniqueChoices(){
    const pool = uniquesList.filter((id) => !player.uniquesSeen.has(id) && !player.uniques.has(id));
    const rarityPools = {
      common: [],
      rare: [],
      epic: [],
    };
    const firstUniqueChest = state.uniqueChestCount === 1;
    const secondUniqueChest = state.uniqueChestCount === 2;
    for (const id of pool){
      const rarity = UNIQUES[id]?.rarity || "common";
      if (firstUniqueChest && rarity !== "common") continue;
      if (rarityPools[rarity]) rarityPools[rarity].push(id);
    }

    currentChoices = [];
    let epicAllowed = !(firstUniqueChest || secondUniqueChest);
    const rarityWeights = {
      common: firstUniqueChest ? 1 : (secondUniqueChest ? 0.65 : 0.55),
      rare: firstUniqueChest ? 0 : 0.35,
      epic: (firstUniqueChest || secondUniqueChest) ? 0 : 0.10,
    };
    function pickRarity(){
      const weights = [
        ["common", rarityWeights.common],
        ["rare", rarityWeights.rare],
        ["epic", rarityWeights.epic],
      ];
      let sum = 0;
      for (const [rarity, w] of weights){
        if (!epicAllowed && rarity === "epic") continue;
        if (!rarityPools[rarity].length) continue;
        sum += w;
      }
      if (sum <= 0) return null;
      let r = Math.random() * sum;
      for (const [rarity, w] of weights){
        if (!epicAllowed && rarity === "epic") continue;
        if (!rarityPools[rarity].length) continue;
        r -= w;
        if (r <= 0) return rarity;
      }
      return null;
    }

    for (let slot = 0; slot < 3; slot++){
      const rarity = pickRarity();
      if (!rarity) break;
      const list = rarityPools[rarity];
      const idx = randi(0, list.length - 1);
      const id = list.splice(idx, 1)[0];
      currentChoices.push({ id, rarity, kind: "unique" });
      if (rarity === "epic") epicAllowed = false;
    }
    for (const c of currentChoices) player.uniquesSeen.add(c.id);
  }

  function renderChoices(){
    choicesWrap.innerHTML = "";
    if (!currentChoices.length){
      const msg = (pickerSource === "unique")
        ? "Уникальные предметы закончились."
        : "Нет доступных улучшений.";
      choicesWrap.innerHTML = `<div class="small" style="opacity:.8">${msg}</div>`;
      return;
    }
    currentChoices.forEach((c, i) => {
      const isUnique = c.kind === "unique";
      const entry = isUnique ? UNIQUES[c.id] : UPGRADES[c.id];
      const lv = isUnique ? 0 : pF.getLevel(c.id);
      const desc = isUnique ? entry.desc : entry.desc(lv);
      const div = document.createElement("div");
      div.className = "choice";
      div.innerHTML = `
        <div class="t">
          ${i + 1}. ${entry.title}
          <span class="pill ${c.rarity}">${c.rarity.toUpperCase()}</span>
        </div>
        <div class="d">${desc}</div>
      `;
      div.addEventListener("click", () => pickChoice(i));
      choicesWrap.appendChild(div);
    });
  }

  function closePickerAndResume(){
    pickerOverlay.style.display = "none";
    ui.buildFromPicker = false;
    btnResume.textContent = "Resume";
    state.paused = false;
  }

  function openUpgradePicker(source){
    state.paused = true;
    ui.buildFromPicker = false;
    btnResume.textContent = "Resume";
    pauseMenu.style.display = "none";
    pickerOverlay.style.display = "grid";

    const isUnique = source === "unique";
    pickerTitle.textContent = source === "chest"
      ? "Сундук — выбери улучшение (шанс rare/epic выше)"
      : (source === "unique" ? "Особый сундук — выбери уникальный предмет" : "Уровень повышен — выбери улучшение");
    pickerHint.textContent = isUnique
      ? "Уникальные предметы появляются только один раз. Skip закрывает."
      : "Клик по карточке или 1/2/3. Reroll (R) тратит жетон. Skip закрывает. Build — посмотреть билд.";

    buildChoices(source);
    renderChoices();
    btnReroll.style.display = isUnique ? "none" : "";
    btnReroll.disabled = isUnique || player.rerolls <= 0;
    forceUpdateRerollsUI({ player });
  }

  function maybeOpenLevelPicker(){
    if (state.pendingLevelUps <= 0) return;
    if (pickerOverlay.style.display === "grid") return;
    state.pendingLevelUps -= 1;
    openUpgradePicker("level");
  }

  function pickChoice(i){
    if (pickerOverlay.style.display !== "grid") return;
    const choice = currentChoices[i];
    if (!choice) return;
    if (choice.kind === "unique"){
      pF.addUniqueItem(choice.id);
      if (pauseMenu.style.display === "grid") updateBuildUI();
      closePickerAndResume();
      maybeOpenLevelPicker();
      return;
    }
    if (!isEligible(choice.id)) return;

    UPGRADES[choice.id].apply();
    player.upgrades[choice.id] = pF.getLevel(choice.id) + 1;
    closePickerAndResume();
    maybeOpenLevelPicker();
  }

  function doReroll(){
    if (pickerOverlay.style.display !== "grid") return;
    if (pickerSource === "unique") return;
    if (player.rerolls <= 0) return;
    player.rerolls -= 1;
    buildChoices(pickerSource);
    renderChoices();
    btnReroll.disabled = player.rerolls <= 0;
    forceUpdateRerollsUI({ player });
  }

  function doSkip(){
    if (pickerOverlay.style.display !== "grid") return;
    closePickerAndResume();
    maybeOpenLevelPicker();
  }

  return {
    openUpgradePicker,
    maybeOpenLevelPicker,
    pickChoice,
    doReroll,
    doSkip,
  };
}
