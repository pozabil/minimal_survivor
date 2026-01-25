import { TOTEM_SPAWN_FIRST } from "../scripts/config.js";

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

export function createUiState() {
  return { buildFromPicker: false, buildTab: "upgrades" };
}
