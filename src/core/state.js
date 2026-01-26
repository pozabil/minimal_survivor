import { TOTEM_SPAWN_FIRST } from "../content/config.js";

export function createState() {
  return {
    t: 0,
    paused: true,
    dead: false,
    deathReason: "",
    kills: 0,
    dmgDone: 0,
    lastDmgWindow: [],
    difficulty: 1,
    chestTimer: 35,
    chestAlive: false,
    chestCount: 0,
    uniqueChestCount: 0,
    maxShirtCd: 0,
    maxShirtSlowT: 0,
    patriarchDollCd: 0,
    dashT: 0,
    dashVx: 0,
    dashVy: 0,
    dashTrailT: 0,
    totemTimer: TOTEM_SPAWN_FIRST,
    totemTimerMax: TOTEM_SPAWN_FIRST,
    healQueue: [],
    healActive: null,
    xpEnemyBonus: 0,
    sameCircleCd: 0,
    auraWaveT: 0,
    auraWaveActive: false,
    auraWaveR: 0,
    auraWaveMaxR: 0,
    auraWaveX: 0,
    auraWaveY: 0,
    auraWaveId: 0,
    auraTickT: 0,
    slowMoT: 0,
    slowMoCd: 0,
    slowMoLocked: false,
    pendingLevelUps: 0,
    maxDps: 0,
  };
}

export function createEntities() {
  return {
    bullets: [],
    enemyBullets: [],
    enemies: [],
    turrets: [],
    drops: [],
    particles: [],
    shockwaves: [],
    floaters: [],
    dashTrail: [],
    lightningStrikes: [],
    clones: [],
    dogs: [],
    chests: [],
    totem: {
      active: false,
      x: 0,
      y: 0,
      r: 0,
      t: 0,
      life: 0,
      lifeMax: 0,
      grace: 0,
      effect: 0,
      inZone: false,
    },
  };
}

export function createSpawn() {
  return {
    timer: 0,
    interval: 0.75,
    packChance: 0.12,
    bossEvery: 120,
    nextBossAt: 120,
    bossActive: 0,
    maxBosses: 1,
    bossCount: 0,
    bossTier: 0,
  };
}

export function createUiState() {
  return { buildFromPicker: false, buildTab: "upgrades" };
}
