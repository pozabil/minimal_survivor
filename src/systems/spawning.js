import {
  TAU,
  ELITE_MODS,
  ELITE_RADIUS_MULT,
  ELITE_XP_REWARD_MULT,
  ELITE_XP_BASE_MULT,
} from "../scripts/config.js";
import { enemyBase } from "../entities/enemies.js";
import { clamp } from "../utils/math.js";
import { randf, randi } from "../utils/rand.js";

function applyElite(e, mod, reward, scale) {
  const s = scale || 1;
  e.elite = true;
  e.eliteMod = mod.id;
  e.eliteColor = mod.color;
  e.eliteReward = !!reward;
  e.hpMax *= mod.hp * s;
  e.hp *= mod.hp * s;
  e.spd *= mod.spd * s;
  e.dmg *= mod.dmg * s;
  e.r *= ELITE_RADIUS_MULT;
  e.xp = Math.round(e.xp * (reward ? ELITE_XP_REWARD_MULT : ELITE_XP_BASE_MULT));
}

function pickEnemyType({ player, state, enemies, forcedType }) {
  if (forcedType) return forcedType;

  let type = "grunt";
  const roll = Math.random();
  const diff = state.difficulty;

  // чем дольше живём — тем больше "экзотики"
  const pRunner = 0.07 + Math.min(0.12, diff * 0.020);
  const pTank = 0.04 + Math.min(0.11, diff * 0.015);
  const pShooter = 0.06 + Math.min(0.14, diff * 0.020);
  const pBomber = 0.04 + Math.min(0.12, diff * 0.018);

  const pDasher = (diff > 2.0) ? (0.03 + Math.min(0.08, (diff - 2) * 0.015)) : 0.0;
  const pSpitter = (diff > 2.5) ? (0.03 + Math.min(0.09, (diff - 2.5) * 0.015)) : 0.0;
  const pShield = (diff > 3.0) ? (0.03 + Math.min(0.08, (diff - 3) * 0.013)) : 0.0;
  const pTriad = (player.lvl >= 15) ? (0.02 + Math.min(0.07, (player.lvl - 15) * 0.006)) : 0.0;
  const unlockBlaster = (player.lvl >= 20 || state.t >= 10 * 60);
  let blasterCount = 0;
  if (unlockBlaster) {
    for (const ee of enemies) {
      if (ee.type === "blaster" && !ee.dead && !ee.dying) blasterCount += 1;
    }
  }
  let pBlaster = unlockBlaster ? (0.01 + Math.min(0.035, diff * 0.005)) : 0.0;
  if (unlockBlaster && blasterCount >= 12) {
    const t = clamp((24 - blasterCount) / 12, 0, 1);
    pBlaster *= t;
  }
  if (blasterCount >= 24) pBlaster = 0;
  const pBurst = (diff > 3.0) ? (0.02 + Math.min(0.07, (diff - 3) * 0.012)) : 0.0;
  const pSplitter = (diff > 3.5) ? (0.02 + Math.min(0.07, (diff - 3.5) * 0.012)) : 0.0;
  const pBrute = (diff > 4.0) ? (0.02 + Math.min(0.06, (diff - 4) * 0.010)) : 0.0;

  const picks = [
    { t: "runner",  w: pRunner },
    { t: "tank",    w: pTank },
    { t: "shooter", w: pShooter },
    { t: "bomber",  w: pBomber },
    { t: "dasher",  w: pDasher },
    { t: "spitter", w: pSpitter },
    { t: "shield",  w: pShield },
    { t: "triad",   w: pTriad },
    { t: "blaster", w: pBlaster },
    { t: "burst",   w: pBurst },
    { t: "splitter",w: pSplitter },
    { t: "brute",   w: pBrute },
  ];
  const total = picks.reduce((sum, p) => sum + p.w, 0);
  const scale = total > 1 ? (1 / total) : 1;
  let acc = 0;
  for (const p of picks) {
    acc += p.w * scale;
    if (roll < acc) {
      type = p.t;
      break;
    }
  }
  if (!type) type = "grunt";
  if (type === "blaster" && blasterCount >= 25) type = "grunt";

  return type;
}

function createBaseEnemy({ type, player, state, extra, b, isMinion, tier }) {
  const normalHpBoost = 0.09 + (player.lvl - 1) * 0.032 + (state.t / 60) * 0.0095;
  const scale = (type === "boss")
    ? (1 + state.difficulty * 0.12 + tier * 0.44)
    : (1 + Math.min(3.2, normalHpBoost));

  let hpMult = 1;
  if (type === "boss") {
    if (extra?.bossKind === "colossus") hpMult = 1.25;
    if (extra?.bossKind === "sniper") hpMult = 0.85;
  }

  const baseEnemy = {
    type,
    x: 0,
    y: 0,
    r: b.r,
    hpMax: b.hp * scale * hpMult,
    hp: b.hp * scale * hpMult,
    spd: b.spd * (0.9 + Math.min(0.35, state.difficulty * 0.03)),
    dmg: b.dmg * (0.9 + Math.min(0.6, state.difficulty * 0.03)),
    xp: b.xp,
    vx: 0,
    vy: 0,
    moveDirX: 1,
    moveDirY: 0,
    hitFlash: 0,
    shotTimer: randf(0, 0.6),
    shotRate: b.shotRate || 0,
    shotSpeed: b.shotSpeed || 0,
    shotDmg: b.shotDmg || 0,
    shotSize: b.shotSize || 0,
    shotLife: b.shotLife || 0,
    explodeR: b.explodeR || 0,
    explodeDmg: b.explodeDmg || 0,
    explodePush: b.explodePush || 0,
    bulletColor: b.bulletColor || null,
    bulletGlow: b.bulletGlow || null,
    burstN: b.burstN || 0,
    burstSpeed: b.burstSpeed || 0,
    burstDmg: b.burstDmg || 0,
    burstGap: b.burstGap || 0,
    burstCooldown: b.burstCooldown || 0,
    burstLeft: 0,
    burstCd: randf(0, b.burstCooldown || 0),
    burstTotal: 0,
    holdT: 0,
    blastKind: 0,
    triRad: b.triRad || 0,
    triSpin: b.triSpin || 0,
    triShotRate: b.triShotRate || 0,
    triShotSpeed: b.triShotSpeed || 0,
    triShotDmg: b.triShotDmg || 0,
    triAngle: 0,
    triDir: 1,
    triShotTimer: 0,
    _oh: null,
    elite: false,
    eliteReward: false,
    eliteMod: null,
    eliteColor: null,
    dying: false,
    deathT: 0,

    bossKind: extra?.bossKind || null,
    bossTier: tier,
    bossDashCd: 0,
    bossDashT: 0,
    bossDashVx: 0,
    bossDashVy: 0,
    bossPhase: 0,
    bossBaseR: 0,
    bossShrinkStage: 0,
  };

  if (isMinion) {
    const diff = state.difficulty;
    const hpScale = 0.9 + Math.min(0.6, diff * 0.03);
    const spdScale = 0.95 + Math.min(0.5, diff * 0.03);
    baseEnemy.hpMax = b.hp * hpScale;
    baseEnemy.hp = b.hp * hpScale;
    baseEnemy.spd = b.spd * spdScale;
    baseEnemy.dmg = b.dmg * spdScale;
  }
  if (type === "blaster") {
    baseEnemy.blastKind = Math.random() < 0.5 ? 1 : 2;
  }

  return baseEnemy;
}

function spawnPack({
  baseEnemy,
  type,
  player,
  ring,
  a,
  nextEnemyId,
  makePackElite,
  eliteMod,
  enemies,
}) {
  const n = randi(2, 5);
  for (let i = 0; i < n; i++) {
    const aa = a + randf(-0.35, 0.35);
    const rr = ring + randf(-40, 40);
    const c = {
      ...baseEnemy,
      id: nextEnemyId(),
      type,
      x: player.x + Math.cos(aa) * rr + randf(-22, 22),
      y: player.y + Math.sin(aa) * rr + randf(-22, 22),
      hpMax: baseEnemy.hpMax * 0.78,
      hp: baseEnemy.hpMax * 0.78,
      spd: baseEnemy.spd * (1.0 + randf(-0.08, 0.12)),
      r: baseEnemy.r * (0.92 + randf(-0.05, 0.08)),
      hitFlash: 0,
      shotTimer: randf(0, 0.6),
      _oh: null,
      bossKind: null,
      bossTier: 0,
      bossDashCd: 0,
      bossDashT: 0,
      bossDashVx: 0,
      bossDashVy: 0,
      bossPhase: 0,
    };
    if (c.type === "triad") {
      c.triAngle = randf(0, TAU);
      c.triDir = Math.random() < 0.5 ? -1 : 1;
      c.triShotTimer = randf(0, 0.8);
    }
    if (makePackElite && eliteMod) applyElite(c, eliteMod, false, 0.85);
    enemies.push(c);
  }
}

export function createSpawnEnemy({
  player,
  state,
  enemies,
  spawnScale,
}) {
  let enemyId = 1;
  const nextEnemyId = () => enemyId++;
  return function spawnEnemy(pack = false, forcedType = null, extra = null) {
    const w = innerWidth;
    const h = innerHeight;
    const margin = 120;
    const ring = (Math.max(w, h) * 0.6 + margin) * spawnScale;
    const a = randf(0, TAU);
    const useSpawnPos = !!(extra && Number.isFinite(extra.spawnX) && Number.isFinite(extra.spawnY));
    const ex = useSpawnPos ? extra.spawnX : (player.x + Math.cos(a) * ring);
    const ey = useSpawnPos ? extra.spawnY : (player.y + Math.sin(a) * ring);
    const isMinion = extra?.minion === true;

    const type = pickEnemyType({ player, state, enemies, forcedType });

    const b = enemyBase(type);
    const tier = extra?.bossTier || 0;

    let eliteMod = null;
    let makeElite = false;
    let makePackElite = false;
    let eliteReward = true;
    if (type !== "boss") {
      if (extra?.forceElite) {
        makeElite = true;
        eliteReward = extra.eliteReward !== false;
        eliteMod = extra.eliteMod || ELITE_MODS[randi(0, ELITE_MODS.length - 1)];
      } else if (!isMinion) {
        const diff = state.difficulty;
        const eliteChance = (diff > 2.5) ? Math.min(0.12, 0.03 + (diff - 2.5) * 0.01) : 0.0;
        const packEliteChance = pack ? Math.min(0.28, 0.12 + Math.max(0, diff - 2.5) * 0.02) : 0.0;
        makePackElite = pack && Math.random() < packEliteChance;
        makeElite = makePackElite || (Math.random() < eliteChance);
        if (makeElite) eliteMod = ELITE_MODS[randi(0, ELITE_MODS.length - 1)];
      }
    }

    const baseEnemy = createBaseEnemy({
      type,
      player,
      state,
      extra,
      b,
      isMinion,
      tier,
    });
    baseEnemy.x = ex;
    baseEnemy.y = ey;

    const e = { ...baseEnemy, id: nextEnemyId() };

    if (type === "boss") {
      e.spd *= (1 + tier*0.05);
      e.shotRate = (e.shotRate || 0.45) * (1 + tier*0.06);
      e.shotDmg *= (1 + tier*0.10);
      e.r = Math.max(e.r, 30 + tier*1.2);
    }
    if (type === "boss" && e.bossKind === "colossus") {
      e.r = Math.max(e.r, 42 + tier*1.6);
      e.bossBaseR = e.r;
      e.bossShrinkStage = 0;
    }
    if (type === "triad"){
      e.triAngle = randf(0, TAU);
      e.triDir = Math.random() < 0.5 ? -1 : 1;
      e.triShotTimer = randf(0, 0.8);
    }
    if (makeElite && eliteMod) applyElite(e, eliteMod, eliteReward);

    enemies.push(e);

    if (pack && type !== "boss") {
      spawnPack({
        baseEnemy,
        type,
        player,
        ring,
        a,
        nextEnemyId,
        makePackElite,
        eliteMod,
        enemies,
      });
    }
    return e;
  };
}

export function updateSpawning({
  dt,
  state,
  player,
  spawn,
  chests,
  totem,
  spawnBoss,
  spawnChest,
  spawnTotem,
  spawnEnemy,
  getChestInterval,
  getTotemInterval,
}) {
  const lvl = player.lvl;
  const bossReduce = Math.floor((lvl - 1) / 5);
  spawn.bossEvery = Math.max(60, 120 - bossReduce * 5);
  spawn.maxBosses = (lvl >= 20) ? (2 + Math.floor((lvl - 20) / 15)) : 1;
  if (spawn.nextBossAt > state.t + spawn.bossEvery) {
    spawn.nextBossAt = state.t + spawn.bossEvery;
  }

  state.difficulty = 1 + (lvl - 1) * 0.35 + (state.t / 60) * 0.1;
  spawn.interval = clamp(0.85 - (lvl - 1) * 0.02, 0.28, 0.85);
  spawn.packChance = clamp(0.10 + (lvl - 1) * 0.01, 0.10, 0.35);

  if (state.t >= spawn.nextBossAt && spawn.bossActive < spawn.maxBosses) {
    spawn.nextBossAt += spawn.bossEvery;
    spawnBoss();
  }

  // chest schedule (self-heal)
  if (state.chestAlive && chests.length === 0) {
    state.chestAlive = false;
    state.chestTimer = Math.max(state.chestTimer, 1);
  }
  if (!state.chestAlive) {
    state.chestTimer -= dt;
    if (state.chestTimer <= 0) {
      state.chestTimer = getChestInterval();
      spawnChest();
    }
  }

  // totem schedule (cooldown does not tick while active)
  if (!totem.active) {
    state.totemTimer -= dt;
    if (state.totemTimer <= 0) {
      spawnTotem();
      const interval = getTotemInterval();
      state.totemTimer = interval;
      state.totemTimerMax = interval;
    }
  }

  // spawns
  spawn.timer -= dt;
  const extraSpawns = Math.max(0, Math.min(5, Math.floor((lvl - 10) / 5)));
  const spawnCount = 1 + extraSpawns;
  while (spawn.timer <= 0) {
    spawn.timer += spawn.interval;
    for (let s = 0; s < spawnCount; s++) {
      const pack = Math.random() < spawn.packChance;
      if (spawn.bossActive > 0 && Math.random() < 0.55) continue;
      spawnEnemy(pack);
    }
  }
}
