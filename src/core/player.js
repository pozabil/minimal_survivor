import { BASE_HP } from "../content/config.js";

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
