import {
  INVULN_LV_STEP,
  INVULN_STEP,
  TANK_INVULN_BONUS_CAP,
} from "../content/config.js";
import {
  TOTEM_SPAWN_EVERY,
  TOTEM_SPAWN_LV_STEP,
  TOTEM_SPAWN_MIN_INTERVAL,
  TOTEM_SPAWN_STEP,
  TOTEM_LIFE_BASE,
  TOTEM_LIFE_STEP,
  TOTEM_LIFE_LV_STEP,
  TOTEM_LIFE_CAP,
  TOTEM_EFFECT_GAIN_BASE,
  TOTEM_EFFECT_GAIN_STEP,
  TOTEM_EFFECT_GAIN_LV_STEP,
  TOTEM_EFFECT_GAIN_CAP,
  TOTEM_DPS_RAMP_BASE,
  TOTEM_DPS_RAMP_GROWTH,
  TOTEM_DPS_RAMP_LV_STEP,
  TOTEM_DPS_RAMP_CAP,
} from "../content/totem.js";
import { BASE_HP } from "../content/players.js";
import {
  ORBITAL_BASE_DISTANCE,
  ORBITAL_BASE_SIZE,
  ORBITAL_SIZE_EXP,
  TURRET_AGGRO_BASE,
  TURRET_DAMAGE,
  TURRET_FIRE_RATE,
  TURRET_SIZE_LV_BONUS,
  TURRET_SIZE_MULT,
} from "../content/upgrades.js";

export function createPlayer() {
  return {
    heroId: "scout",
    heroName: "Скаут",
    heroPerkText: "",
    x: 0,
    y: 0,
    r: 14,
    vx: 0,
    vy: 0,
    speed: 260,
    baseSpeed: 260,
    flatSpeed: 0,
    hpMax: BASE_HP,
    hp: BASE_HP,
    regen: 0,
    invuln: 0,
    magnet: 120,

    lvl: 1,
    xp: 0,
    xpNeed: 40,

    fireRate: 4.2,
    shotTimer: 0,
    bulletSpeed: 520,
    bulletSize: 5,
    damage: 16,
    baseDamage: 16,
    pierce: 1,
    spread: 0.0,
    multishot: 1,
    critChance: 0.04,
    critMult: 1.8,
    ricochetChance: 0.0,
    ricochetBounces: 0,

    armor: 0.0, // до 60% снижения входящего урона
    dodge: 0.0, // шанс уклониться (0..0.35)
    lifeSteal: 0, // уровни лайфстила (0..8)

    orbitals: 0,
    orbitalRadius: 48,
    orbitalSpeed: 2.2,
    orbitalDamage: 12,
    orbitalHitCD: 0.22,

    aura: false,
    auraRadius: 72,
    auraDps: 14,

    auraSlow: 0.0,

    novaCount: 0,
    novaDamage: 32,
    novaRate: 0.56,
    novaSpeed: 460,
    novaTimer: 0,
    novaMagnet: 0,

    upgrades: {},
    rerolls: 2,
    rerollCap: 4,

    xpGainMult: 1.0,
    xpNeedMult: 1.0,
    damageTakenMult: 1.0,
    chestBonusReroll: 0,
    chestBonusRare: 0.0,

    uniques: new Set(),
    uniquesSeen: new Set(),
    uniquesOrder: [],

    dashCd: 0,
    lastDirX: 1,
    lastDirY: 0,
  };
}

export function createPlayerFunctions({
  player,
  totem,
  uniques,
  uniquesList,
}) {
  function getLevel(id){
    return player.upgrades[id] || 0;
  }
  function hasUnique(id){
    return player.uniques.has(id);
  }
  function hasAnyActionSkill(){
    if (!uniques) return false;
    for (const id of player.uniques){
      const u = uniques[id];
      if (u && u.action) return true;
    }
    return false;
  }
  function hasRemainingUnique(){
    if (!uniquesList) return false;
    const remaining = uniquesList.filter((id)=>!player.uniquesSeen.has(id) && !player.uniques.has(id));
    return remaining.length >= 3;
  }

  function getChestInterval(){
    const reduce = Math.floor((player.lvl - 1) / 4);
    return Math.max(20, 35 - reduce);
  }
  function getTotemInterval(){
    const reduce = Math.floor((player.lvl - 1) / TOTEM_SPAWN_LV_STEP) * TOTEM_SPAWN_STEP;
    return Math.max(TOTEM_SPAWN_MIN_INTERVAL, TOTEM_SPAWN_EVERY - reduce);
  }
  function getTotemLife(){
    const bonus = Math.floor(Math.max(0, player.lvl) / TOTEM_LIFE_LV_STEP) * TOTEM_LIFE_STEP;
    return Math.min(TOTEM_LIFE_CAP, TOTEM_LIFE_BASE + bonus);
  }
  function getInvulnDuration(base, min){
    const steps = Math.floor(Math.max(0, player.lvl) / INVULN_LV_STEP);
    return Math.max(min, base - steps * INVULN_STEP);
  }
  function getInvulnAfterHit(base){
    if (player.heroId === "tank") return base + Math.min(base * 0.3, TANK_INVULN_BONUS_CAP);
    return base;
  }
  function getTotemEffectGain(){
    const bonus = Math.floor(Math.max(0, player.lvl) / TOTEM_EFFECT_GAIN_LV_STEP) * TOTEM_EFFECT_GAIN_STEP;
    return Math.min(TOTEM_EFFECT_GAIN_CAP, TOTEM_EFFECT_GAIN_BASE + bonus);
  }
  function getTotemDpsRamp(){
    const steps = Math.floor(Math.max(0, player.lvl) / TOTEM_DPS_RAMP_LV_STEP);
    return Math.min(TOTEM_DPS_RAMP_CAP, TOTEM_DPS_RAMP_BASE * Math.pow(TOTEM_DPS_RAMP_GROWTH, steps));
  }
  function getRicochetBounces(){
    if (player.ricochetChance <= 0) return 0;
    return 1 + (player.ricochetBounces || 0);
  }
  function getTurretLevel(){
    return getLevel("turret");
  }
  function getTurretChance(){
    return 0.02 * getTurretLevel();
  }
  function getTurretMax(){
    return getTurretLevel();
  }
  function getTurretAggroRadius(){
    const lvl = getTurretLevel();
    if (lvl <= 0) return 0;
    return TURRET_AGGRO_BASE * (1 + 0.20 * (lvl - 1));
  }
  function getTurretSize(){
    const lvl = getTurretLevel();
    if (lvl <= 0) return 0;
    const base = player.r * 2 * TURRET_SIZE_MULT;
    return base * (1 + TURRET_SIZE_LV_BONUS * (lvl - 1));
  }
  function getWoundedDamageMult(){
    if (!hasUnique("baltika9")) return 1;
    const hpRatio = player.hpMax > 0 ? (player.hp / player.hpMax) : 1;
    if (hpRatio >= 0.5) return 1;
    const bonus = (0.5 - hpRatio) * 0.5;
    return 1 + bonus;
  }
  function getTurretDamageScale(){
    const base = player.baseDamage || player.damage || 1;
    return (player.damage / base) * getWoundedDamageMult();
  }
  function getTurretDamage(){
    const lv = getLevel("turretLevel");
    return TURRET_DAMAGE * Math.pow(1.12, lv) * getTurretDamageScale();
  }
  function getTurretFireRate(){
    const lv = getLevel("turretLevel");
    return TURRET_FIRE_RATE * Math.pow(1.12, lv);
  }
  function getOrbitalSize(){
    return ORBITAL_BASE_SIZE * Math.pow(player.orbitalRadius / ORBITAL_BASE_DISTANCE, ORBITAL_SIZE_EXP);
  }
  function getMoveSpeed(){
    const flat = player.flatSpeed || 0;
    const base = player.speed;
    const bonus = (hasUnique("peace_pipe") && totem && totem.active && totem.inZone) ? 1.02 : 1;
    return base * bonus + flat;
  }
  function getBaseMoveSpeed(){
    const flat = player.flatSpeed || 0;
    const base = player.baseSpeed || player.speed || 1;
    const bonus = (hasUnique("peace_pipe") && totem && totem.active && totem.inZone) ? 1.02 : 1;
    return base * bonus + flat;
  }
  function getTurretHpMax(){
    const lv = getLevel("turretLevel");
    return player.hpMax * 1.4 * Math.pow(1.12, lv);
  }
  function hasTurretHeal(){
    return getLevel("turretHeal") > 0;
  }

  return {
    getBaseMoveSpeed,
    getChestInterval,
    getLevel,
    getMoveSpeed,
    getOrbitalSize,
    getRicochetBounces,
    getInvulnAfterHit,
    getInvulnDuration,
    getTotemInterval,
    getTotemDpsRamp,
    getTotemEffectGain,
    getTotemLife,
    getTurretAggroRadius,
    getTurretChance,
    getTurretDamage,
    getTurretDamageScale,
    getTurretFireRate,
    getTurretHpMax,
    getTurretLevel,
    getTurretMax,
    getTurretSize,
    getWoundedDamageMult,
    hasAnyActionSkill,
    hasRemainingUnique,
    hasTurretHeal,
    hasUnique,
  };
}
