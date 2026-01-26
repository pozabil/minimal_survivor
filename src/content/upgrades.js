import { AURA_WAVE_FORCE_STEP } from "./config.js";
import { clamp } from "../utils/math.js";
import { fmtNum } from "../utils/format.js";

export function createUpgrades({
  player,
  state,
  getLevel,
  getAuraWaveCooldown,
}) {
  return {
    fireRate: { title:"Скорость атаки", max: 12, desc:(lv)=>`+18% fire rate (ур. ${lv+1}/12)`, apply:()=>{ player.fireRate *= 1.18; } },
    damage:   { title:"Урон",           max: 12, desc:(lv)=>`+20% bullet damage (ур. ${lv+1}/12)`, apply:()=>{ player.damage *= 1.20; } },
    pierce:   { title:"Пробивание",     max: 6,  desc:(lv)=>`+1 pierce (ур. ${lv+1}/6)`,  apply:()=>{ player.pierce += 1; } },
    multishot:{ title:"Мультивыстрел",  max: 7,  desc:(lv)=>`+1 projectile (ур. ${lv+1}/7)`,apply:()=>{ player.multishot += 1; player.spread = Math.max(player.spread, 0.12); } },
    nova:     { title:"Нова",           max: 8,  desc:(lv)=>`+3 снаряда по кругу (ур. ${lv+1}/8)`, apply:()=>{ player.novaCount = Math.min(8, player.novaCount + 1); } },
    novaDamage:{title:"Нова: урон",     max: 10, desc:(lv)=>`+18% урон новы (ур. ${lv+1}/10)`, apply:()=>{ player.novaDamage *= 1.18; } },
    novaRate: { title:"Нова: скор. атаки", max: 10, desc:(lv)=>`+15% скорость атаки новы (ур. ${lv+1}/10)`, apply:()=>{ player.novaRate *= 1.15; } },
    novaSpeed:{ title:"Нова: скорость", max: 10, desc:(lv)=>`+15% скорость снаряда новы (ур. ${lv+1}/10)`, apply:()=>{ player.novaSpeed *= 1.15; } },
    novaMagnet:{ title:"Нова: притяжение", max: 1, desc:()=>`Нова притягивает орбы к игроку`, apply:()=>{ player.novaMagnet = 1; } },
    turret:   { title:"Турель",         max: 4,  desc:(lv)=>{
      const lvl = lv + 1;
      const chance = lvl * 2;
      const maxT = lvl;
      const aggroText = lvl === 1 ? "малое агро" : "агро больше";
      return `${chance}% шанс · макс ${maxT} · ${aggroText} (ур. ${lvl}/4)`;
    }, apply:()=>{} },
    turretLevel:{ title:"Турель: усиление", max: 6, desc:(lv)=>`+12% урон/скорость/HP турели (ур. ${lv+1}/6)`, apply:()=>{} },
    turretHeal:{ title:"Турель: сбор XP", max: 1, desc:()=>`Турель притягивает XP-шарики к игроку`, apply:()=>{} },
    bulletSpeed:{ title:"Скорость пули",max: 10, desc:(lv)=>`+15% bullet speed (ур. ${lv+1}/10)`, apply:()=>{ player.bulletSpeed *= 1.15; } },
    crit:     { title:"Криты",          max: 8, desc:(lv)=>`+4% crit chance (ур. ${lv+1}/8)`, apply:()=>{ player.critChance = Math.min(0.36, player.critChance + 0.04); } },


    bulletSize:{ title:"Размер пули",   max: 3,  desc:(lv)=>`+20% bullet size (ур. ${lv+1}/3)`, apply:()=>{ player.bulletSize *= 1.20; } },
    critMultUp:{ title:"Криты: множ.",  max: 8,  desc:(lv)=>`+12% crit multiplier (ур. ${lv+1}/8)`, apply:()=>{ player.critMult *= 1.12; } },
    ricochetChance:{ title:"Рикошет: шанс", max: 5, desc:(lv)=>`+6% шанс рикошета (ур. ${lv+1}/5)`, apply:()=>{ player.ricochetChance = clamp((player.ricochetChance||0) + 0.06, 0, 0.30); } },
    ricochetBounces:{ title:"Рикошет: отскоки", max: 3, desc:(lv)=>`+1 отскок (ур. ${lv+1}/3)`, apply:()=>{ player.ricochetBounces = Math.min(3, (player.ricochetBounces||0) + 1); } },

    armor:    { title:"Броня",         max: 8,  desc:(lv)=>`-6% входящий урон (ур. ${lv+1}/8)`, apply:()=>{ player.armor = clamp((player.armor||0) + 0.06, 0, 0.60); } },
    dodge:    { title:"Уклонение",     max: 6,  desc:(lv)=>`+5% шанс не получить урон (ур. ${lv+1}/6)`, apply:()=>{ player.dodge = clamp((player.dodge||0) + 0.05, 0, 0.35); } },
    lifesteal:{ title:"Лайфстил",      max: 8,  desc:(lv)=>`+1% шанс отхилить 1% HP (ур. ${lv+1}/8) · килл: 2% на 1% HP`, apply:()=>{ player.lifeSteal = Math.min(8, (player.lifeSteal||0) + 1); } },

    xpGain:   { title:"Опыт",          max: 8,  desc:(lv)=>`+10% XP (ур. ${lv+1}/8)`, apply:()=>{ player.xpGainMult = (player.xpGainMult || 1) * 1.10; } },
    rerollCap:{ title:"Лимит reroll",  max: 4,  desc:(lv)=>`+2 max rerolls (ур. ${lv+1}/4)`, apply:()=>{ player.rerollCap += 2; } },

    orbitalSpeedUp:{ title:"Орбиталки: скорость", max: 10, desc:(lv)=>`+18% orbital speed (ур. ${lv+1}/10)`, apply:()=>{ player.orbitalSpeed *= 1.18; } },
    auraSlow: { title:"Аура: замедление", max: 8, desc:(lv)=>`+7.5% slow в ауре (ур. ${lv+1}/8)`, apply:()=>{ player.auraSlow = clamp((player.auraSlow||0) + 0.075, 0, 0.60); } },

    speed:    { title:"Скорость",       max: 10, desc:(lv)=>`+10% move speed (ур. ${lv+1}/10)`, apply:()=>{ player.speed *= 1.10; } },
    hp:       { title:"Живучесть",      max: 10, desc:(lv)=>`+22 max HP +3% (+heal) (ур. ${lv+1}/10)`, apply:()=>{ const prevMax = player.hpMax; const newMax = Math.round((prevMax + 22) * 1.03); player.hpMax = newMax; const delta = newMax - prevMax; if (delta > 0) player.hp = Math.min(player.hpMax, player.hp + delta); } },
    regen:    { title:"Регенерация",    max: 10, desc:(lv)=>`+1.0 HP/сек (ур. ${lv+1}/10)`, apply:()=>{ player.regen += 1.0; } },
    magnet:   { title:"Магнит",         max: 8,  desc:(lv)=>`+40 радиус подбора XP (ур. ${lv+1}/8)`,  apply:()=>{ player.magnet += 40; } },

    orbital:  { title:"Орбиталка",      max: 11, desc:(lv)=>`Орбиталок +${lv === 0 ? 2 : 1} (ур. ${lv+1}/11)`, apply:()=>{ const lv = getLevel("orbital"); const add = (lv === 0) ? 2 : 1; const cap = (player.heroId === "mage") ? 13 : 12; player.orbitals = Math.min(cap, player.orbitals + add); } },
    orbitalDmg:{title:"Орбиталки: урон",max: 12, desc:(lv)=>`+25% orbital damage (ур. ${lv+1}/12)`, apply:()=>{ player.orbitalDamage *= 1.25; } },
    orbitalRadius:{title:"Орбиталки: радиус",max: 10, desc:(lv)=>`+16 orbital radius (ур. ${lv+1}/10)`, apply:()=>{ player.orbitalRadius += 16; } },

    aura:     { title:"Аура",           max: 1,  desc:()=>`Включить ауру урона рядом`, apply:()=>{ player.aura = true; } },
    auraRadius:{title:"Аура: радиус",   max: 10, desc:(lv)=>`+16 aura radius (ур. ${lv+1}/10)`, apply:()=>{ player.auraRadius += 16; } },
    auraDps:  { title:"Аура: DPS",      max: 12, desc:(lv)=>`+30% aura DPS (ур. ${lv+1}/12)`, apply:()=>{ player.auraDps *= 1.30; } },
    auraWave: { title:"Аура: волна",    max: 5,  desc:(lv)=>`Волна каждые ${fmtNum(getAuraWaveCooldown(lv + 1), 1)}с · сила +${AURA_WAVE_FORCE_STEP} (ур. ${lv+1}/5)`, apply:()=>{ if (getLevel("auraWave") === 0) state.auraWaveT = getAuraWaveCooldown(1); } },
  };
}
