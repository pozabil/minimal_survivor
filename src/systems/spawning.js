import { TAU } from "../core/constants.js";
import { UNIQUE_CHEST_EVERY } from "../content/config.js";
import {
  TOTEM_GRACE,
  TOTEM_DAMAGE_TICK,
  TOTEM_SPAWN_MIN,
  TOTEM_SPAWN_MAX,
  TOTEM_RADIUS_MIN,
  TOTEM_RADIUS_MAX,
} from "../content/totem.js";
import {
  ELITE_MODS,
  ELITE_RADIUS_MULT,
  ELITE_XP_REWARD_MULT,
  ELITE_XP_BASE_MULT,
  ENEMY_BASE,
  BOSS_KINDS,
} from "../content/enemies.js";
import {
  TURRET_MIN_DIST,
  TURRET_SPAWN_RADIUS,
} from "../content/upgrades.js";
import {
  DOG_RADIUS,
  DOG_BROWN_COLORS,
  DOG_GRAY_COLOR,
  DOG_GRAY_CHANCE,
} from "../content/dog.js";
import { clamp, len2Sq } from "../utils/math.js";
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

function pickEnemyType({ player, state, enemies, forcedType, enemyTypePicks }) {
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

  enemyTypePicks[0].w = pRunner;
  enemyTypePicks[1].w = pTank;
  enemyTypePicks[2].w = pShooter;
  enemyTypePicks[3].w = pBomber;
  enemyTypePicks[4].w = pDasher;
  enemyTypePicks[5].w = pSpitter;
  enemyTypePicks[6].w = pShield;
  enemyTypePicks[7].w = pTriad;
  enemyTypePicks[8].w = pBlaster;
  enemyTypePicks[9].w = pBurst;
  enemyTypePicks[10].w = pSplitter;
  enemyTypePicks[11].w = pBrute;
  const total = enemyTypePicks.reduce((sum, p) => sum + p.w, 0);
  const scale = total > 1 ? (1 / total) : 1;
  let acc = 0;
  for (const p of enemyTypePicks) {
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
  const normalHpBoost = 0.09 + 0.1 * (state.difficulty - 1)
  const scale = (type === "boss")
    ? (1 + state.difficulty * 0.12 + tier * 0.44)
    : (1 + Math.min(6.4, normalHpBoost));
  const damageScale = 0.9 + Math.min(2.9, state.difficulty * 0.04);

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
    spd: b.spd * (0.9 + Math.min(0.35, state.difficulty * 0.024)),
    dmg: b.dmg * damageScale,
    xp: b.xp,
    vx: 0,
    vy: 0,
    moveDirX: 1,
    moveDirY: 0,
    hitFlash: 0,
    shotTimer: randf(0, 0.6),
    shotRate: b.shotRate || 0,
    shotSpeed: b.shotSpeed || 0,
    shotDmg: (b.shotDmg || 0) * damageScale,
    shotSize: b.shotSize || 0,
    shotLife: b.shotLife || 0,
    explodeR: b.explodeR || 0,
    explodeDmg: b.explodeDmg || 0,
    explodePush: b.explodePush || 0,
    bulletColor: b.bulletColor || null,
    bulletGlow: b.bulletGlow || null,
    burstN: b.burstN || 0,
    burstSpeed: b.burstSpeed || 0,
    burstDmg: (b.burstDmg || 0) * damageScale,
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
    triShotDmg: (b.triShotDmg || 0) * damageScale,
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

export function createSpawnEnemy({ player, state, enemies, spawnScale }) {
  let enemyId = 1;
  const nextEnemyId = () => enemyId++;
  const enemyTypePicks = [
    { t: "runner", w: 0 },
    { t: "tank", w: 0 },
    { t: "shooter", w: 0 },
    { t: "bomber", w: 0 },
    { t: "dasher", w: 0 },
    { t: "spitter", w: 0 },
    { t: "shield", w: 0 },
    { t: "triad", w: 0 },
    { t: "blaster", w: 0 },
    { t: "burst", w: 0 },
    { t: "splitter", w: 0 },
    { t: "brute", w: 0 },
  ];
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

    const type = pickEnemyType({ player, state, enemies, forcedType, enemyTypePicks });

    const b = ENEMY_BASE[type];
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

export function createSpawnBoss({ spawn, spawnEnemy, elBossWrap }) {
  const bossPickBuffer = [];

  function pickBossKind() {
    const maxUnlock = Math.min(BOSS_KINDS.length - 1, spawn.bossTier);
    bossPickBuffer.length = 0;
    for (const b of BOSS_KINDS){
      if (b.unlock <= maxUnlock) bossPickBuffer.push(b);
    }
    if (!bossPickBuffer.length) return null;
    return bossPickBuffer[randi(0, bossPickBuffer.length - 1)];
  }

  return function spawnBoss(kindId = null) {
    if (spawn.bossActive >= spawn.maxBosses) return;
    const kind = kindId ? BOSS_KINDS.find((b) => b.id === kindId) : pickBossKind();
    if (!kind) return;
    spawn.bossActive += 1;
    spawn.bossCount += 1;
    spawn.bossTier = Math.max(spawn.bossTier, spawn.bossCount - 1);
    spawnEnemy(false, "boss", { bossKind: kind.id, bossTier: spawn.bossTier });
    elBossWrap.style.display = "block";
  };
}

export function createSpawnColossusElite({ player, state, spawnEnemy }) {
  const colossusPickBuffer = ["grunt", "runner", "tank", "shooter", "brute", "", "", ""];

  function pickColossusEliteType() {
    let count = 5;
    if (state.difficulty > 3.0) {
      colossusPickBuffer[count++] = "spitter";
      colossusPickBuffer[count++] = "dasher";
    }
    if (player.lvl >= 18) colossusPickBuffer[count++] = "shield";
    return colossusPickBuffer[randi(0, count - 1)];
  }

  return function spawnColossusElite(boss) {
    const type = pickColossusEliteType();
    const ang = randf(0, TAU);
    const dist = Math.max(28, boss.r + randf(18, 42));
    const ex = boss.x + Math.cos(ang) * dist;
    const ey = boss.y + Math.sin(ang) * dist;
    const elite = spawnEnemy(false, type, { spawnX: ex, spawnY: ey, forceElite: true });
    if (elite) {
      elite.vx = 0;
      elite.vy = 0;
    }
  };
}

export function createSpawnChest({ state, chests, totem, player, pF }) {
  return function spawnChest() {
    if (state.chestAlive) return;
    if (chests.length > 0) { state.chestAlive = true; return; }
    state.chestAlive = true;
    state.chestCount += 1;
    const isSpecial = (state.chestCount % UNIQUE_CHEST_EVERY === 0) && pF.hasRemainingUnique();
    if (isSpecial) state.uniqueChestCount += 1;
    const chestR = isSpecial ? 22 : 16;

    const useTotem = totem.active;
    for (let tries = 0; tries < 20; tries++) {
      if (useTotem) {
        const a = randf(0, TAU);
        const d = Math.sqrt(Math.random()) * totem.r;
        const x = totem.x + Math.cos(a) * d;
        const y = totem.y + Math.sin(a) * d;
        if (len2Sq(x - player.x, y - player.y) < 260 * 260) continue;
        chests.push({ x, y, r: chestR, t: 0, bob: randf(0, TAU), special: isSpecial });
        return;
      } else {
        const a = randf(0, TAU);
        const d = randf(320, 620);
        const x = player.x + Math.cos(a) * d;
        const y = player.y + Math.sin(a) * d;
        if (len2Sq(x - player.x, y - player.y) < 260 * 260) continue;
        chests.push({ x, y, r: chestR, t: 0, bob: randf(0, TAU), special: isSpecial });
        return;
      }
    }
    if (useTotem) {
      chests.push({ x: totem.x, y: totem.y, r: chestR, t: 0, bob: 0, special: isSpecial });
    } else {
      chests.push({ x: player.x + 420, y: player.y, r: chestR, t: 0, bob: 0, special: isSpecial });
    }
  };
}

export function createSpawnTotem({ player, totem, pF }) {
  return function spawnTotem() {
    if (totem.active) return;
    const a = randf(0, TAU);
    const d = randf(TOTEM_SPAWN_MIN, TOTEM_SPAWN_MAX);
    totem.x = player.x + Math.cos(a) * d;
    totem.y = player.y + Math.sin(a) * d;
    const lvlScale = 1 + Math.min(0.8, Math.max(0, player.lvl - 1) * 0.005);
    totem.r = randf(TOTEM_RADIUS_MIN, TOTEM_RADIUS_MAX) * lvlScale;
    if (pF.hasUnique("nose_ring")) totem.r *= 1.08;
    totem.t = 0;
    totem.life = pF.getTotemLife();
    totem.lifeMax = totem.life;
    totem.grace = TOTEM_GRACE;
    totem.dmgTickT = TOTEM_DAMAGE_TICK;
    totem.dmgAcc = 0;
    totem.active = true;
    totem.inZone = false;
  };
}

export function createSpawnTurret({ player, turrets, pF }) {
  return function spawnTurret() {
    if (pF.getTurretLevel() <= 0) return;
    if (turrets.length >= pF.getTurretMax()) return;
    const a = randf(0, TAU);
    const d = randf(TURRET_MIN_DIST, TURRET_SPAWN_RADIUS);
    const x = player.x + Math.cos(a) * d;
    const y = player.y + Math.sin(a) * d;
    const size = pF.getTurretSize();
    const hpMax = pF.getTurretHpMax();
    turrets.push({
      x, y,
      r: size * 0.5,
      size,
      hpMax,
      hp: hpMax,
      shotTimer: randf(0, 0.4),
      hitCd: 0,
    });
  };
}

export function createSpawnDog({ player, dogs }) {
  function pickDogColor() {
    if (Math.random() < DOG_GRAY_CHANCE) return DOG_GRAY_COLOR;
    return DOG_BROWN_COLORS[Math.floor(Math.random() * DOG_BROWN_COLORS.length)];
  }

  return function spawnDog() {
    if (dogs.length) return;
    const a = randf(0, TAU);
    const d = player.r + 12;
    dogs.push({
      x: player.x + Math.cos(a) * d,
      y: player.y + Math.sin(a) * d,
      r: DOG_RADIUS,
      ang: a,
      orbit: a,
      hitCd: 0,
      target: null,
      color: pickDogColor(),
    });
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
  pF,
}) {
  const lvl = player.lvl;
  const bossReduce = Math.floor((lvl - 1) / 5);
  spawn.bossEvery = Math.max(60, 120 - bossReduce * 5);
  spawn.maxBosses = (lvl >= 20) ? (2 + Math.floor((lvl - 20) / 15)) : 1;
  if (spawn.nextBossAt > state.t + spawn.bossEvery) {
    spawn.nextBossAt = state.t + spawn.bossEvery;
  }

  const minutes = state.t / 60;
  state.difficulty = 1 + (lvl - 1) * 0.35 + 0.012 * minutes * minutes;
  const baseInterval = clamp(0.85 - (lvl - 1) * 0.02, 0.28, 0.85);
  let interval = baseInterval;
  if (lvl >= 70) {
    interval = 0.20;
  } else if (lvl >= 50) {
    interval = 0.23 - (lvl - 50) * (0.03 / 20);
  } else if (lvl >= 30) {
    interval = 0.28 - (lvl - 30) * (0.05 / 20);
  }
  spawn.interval = clamp(interval, 0.20, 0.85);
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
      state.chestTimer = pF.getChestInterval();
      spawnChest();
    }
  }

  // totem schedule (cooldown does not tick while active)
  if (!totem.active) {
    state.totemTimer -= dt;
    if (state.totemTimer <= 0) {
      spawnTotem();
      const interval = pF.getTotemInterval();
      state.totemTimer = interval;
      state.totemTimerMax = interval;
    }
  }

  // spawns
  spawn.timer -= dt;
  const extraSpawns = Math.max(0, Math.min(5, Math.floor((lvl - 10) / 5)));
  const spawnCount = 1 + extraSpawns;
  const bossSpawnSkipChance = clamp(0.55 - Math.max(0, lvl - 30) * 0.01, 0.30, 0.55);
  while (spawn.timer <= 0) {
    spawn.timer += spawn.interval;
    for (let s = 0; s < spawnCount; s++) {
      const pack = Math.random() < spawn.packChance;
      if (spawn.bossActive > 0 && Math.random() < bossSpawnSkipChance) continue;
      spawnEnemy(pack);
    }
  }
}
