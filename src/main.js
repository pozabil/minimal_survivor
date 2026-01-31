import {
  ENEMY_MAX_R,
  COLOSSUS_HP_STEP,
  COLOSSUS_SHRINK_STEP,
  COLOSSUS_SPAWN_STAGES,
  BURST_TELEGRAPH,
  HEAL_OVER_TIME,
  CAMERA_ZOOM_OUT,
  DASH_DISTANCE,
  DASH_DURATION,
  DASH_COOLDOWN,
  DASH_INVULN,
  DASH_TRAIL_LIFE,
  DASH_TRAIL_INTERVAL,
  DASH_TRAIL_MAX,
  SAME_CIRCLE_LIFE,
  SAME_CIRCLE_RADIUS,
  SAME_CIRCLE_DAMAGE_MULT,
  MAX_SHIRT_SLOW_DURATION,
  MAX_SHIRT_COOLDOWN,
  MAX_SHIRT_KILL_CD_REDUCE,
  PATRIARCH_DOLL_COOLDOWN,
  PATRIARCH_DOLL_DAMAGE_MULT,
  PATRIARCH_DOLL_TARGETS_MIN,
  PATRIARCH_DOLL_TARGETS_MAX,
  LIGHTNING_STRIKE_LIFE,
  LIGHTNING_STRIKE_SEGMENTS_MIN,
  LIGHTNING_STRIKE_SEGMENTS_MAX,
  LIGHTNING_STRIKE_JITTER,
  LIGHTNING_STRIKE_HEIGHT_MIN,
  LIGHTNING_STRIKE_HEIGHT_MAX,
  DOG_RADIUS,
  DOG_SPEED,
  DOG_TURN_RATE,
  DOG_HIT_COOLDOWN,
  DOG_CRIT_CHANCE,
  DOG_BALTIKA_AVOID_R,
  DOG_BROWN_COLORS,
  DOG_GRAY_COLOR,
  DOG_GRAY_CHANCE,
  XP_BONUS_NORMAL,
  XP_BONUS_ELITE,
  XP_BONUS_BOSS,
  INVULN_LV_STEP,
  INVULN_STEP,
  INVULN_BULLET_BASE,
  INVULN_BULLET_MIN,
  INVULN_CONTACT_BASE,
  INVULN_CONTACT_MIN,
  TANK_INVULN_BONUS_CAP,
  TOTEM_LIFE_BASE,
  TOTEM_LIFE_STEP,
  TOTEM_LIFE_LV_STEP,
  TOTEM_LIFE_CAP,
  TOTEM_EFFECT_GAIN_BASE,
  TOTEM_EFFECT_GAIN_STEP,
  TOTEM_EFFECT_GAIN_LV_STEP,
  TOTEM_EFFECT_GAIN_CAP,
  TOTEM_EFFECT_DECAY,
  TOTEM_DPS_BASE,
  TOTEM_DPS_RAMP_BASE,
  TOTEM_DPS_RAMP_GROWTH,
  TOTEM_DPS_RAMP_LV_STEP,
  TOTEM_DPS_RAMP_CAP,
  TOTEM_EFFECT_MAX,
} from "./content/config.js";
import {
  TAU,
  JOY_HALF,
  JOY_MARGIN,
} from "./core/constants.js";
import { initCanvas } from "./core/canvas.js";
import { clamp, lerp, len2, len2Sq } from "./utils/math.js";
import { randf, randi } from "./utils/rand.js";
import { circleHit, circleRectHit, pushAway } from "./utils/collision.js";
import { fmtTime, fmtPct, fmtNum, fmtSignedPct } from "./utils/format.js";
import {
  AURA_TICK_INTERVAL,
  AURA_WAVE_BASE_FORCE,
  AURA_WAVE_BOSS_MULT,
  AURA_WAVE_COOLDOWN_BASE,
  AURA_WAVE_COOLDOWN_STEP,
  AURA_WAVE_ELITE_MULT,
  AURA_WAVE_FORCE_STEP,
  AURA_WAVE_HIT_COOLDOWN,
  AURA_WAVE_POS_MULT,
  AURA_WAVE_THICKNESS,
  AURA_WAVE_TRAVEL_TIME,
  AURA_WAVE_VEL_MULT,
  ORBITAL_KNOCKBACK_CHANCE,
  ORBITAL_KNOCKBACK_FORCE,
  PIERCE_DAMAGE_FALLOFF,
  PIERCE_DAMAGE_MIN_RATIO,
  TURRET_BULLET_SIZE,
  TURRET_BULLET_SPEED,
  TURRET_MIN_DIST,
  TURRET_RANGE,
  TURRET_SPAWN_RADIUS,
  createUpgrades,
} from "./content/upgrades.js";
import { createUniques, SAME_CIRCLE_INTERVAL } from "./content/uniques.js";
import { BOSS_NAME } from "./content/enemies.js";
import { getPlayerClass, PLAYER_CLASSES } from "./content/players.js";
import { initState } from "./core/init.js";
import { createPlayerFunctions } from "./core/player.js";
import { startLoop } from "./core/loop.js";
import { createStep } from "./flow/step.js";
import { updateMovement } from "./systems/movement.js";
import { createSpatialGrid } from "./systems/spatial_grid.js";
import {
  createRenderBatch,
  batchCirclePush,
  batchCircleDraw,
  batchMapPush,
  batchMapClear,
  ensureRoundRectPolyfill,
  renderOffscreenArrow,
} from "./systems/render.js";
import {
  createSpawnBoss,
  createSpawnChest,
  createSpawnColossusElite,
  createSpawnEnemy,
  createSpawnTotem,
  updateSpawning,
} from "./systems/spawning.js";
import { loadRecords, updateRecordsOnDeath } from "./systems/storage.js";
import { initHud } from "./ui/hud.js";
import { initOverlays } from "./ui/overlays.js";
import { bindOptionsUI } from "./ui/options.js";

(() => {
  "use strict";

  const fatal = document.getElementById("fatal");
  const fatalText = document.getElementById("fatalText");

  function crash(err){
    console.error(err);
    fatalText.textContent = String(err && err.stack ? err.stack : err);
    fatal.style.display = "grid";
  }

  try {
    const canvas = document.getElementById("c");

    const hud = initHud();
    const overlays = initOverlays();

    // HUD
    const {
      elTime, elLvl, elKills, elEnemiesCount, elShots, elDps, elFps, elWep, elRerolls, elThreat, elActionHint,
      activeItemsEl, activeItemsListEl, elChestRespawn, totemTimerEl, totemWarningEl, hpbar, hpbarPulse, xpbar,
      hptext, xptext, totemBar, totemText, bossBar, bossText, chestBar, chestText, bossWrap, bossList,
    } = hud.elements;

    // Overlays
    const {
      mainMenuOverlay, btnFreePlay, btnMenuRecords, btnMenuSettings, startOverlay, charsWrap, pickerOverlay,
      pickerTitle, pickerHint, choicesWrap, btnReroll, btnSkip, btnShowBuild, pauseMenu, buildListEl, invListEl,
      tabUpgrades, tabInventory, buildStatsEl, btnResume, btnRestart2, btnCopy, btnRecords, btnSettings, btnHang,
      restartConfirmOverlay, btnRestartYes, btnRestartNo, gameoverOverlay, summaryEl, restartBtn, copyBtn,
      btnRecordsOver, recordsOverlay, recordsListEl, btnRecordsClose, settingsOverlay, btnSettingsClose,
      optShowDamageNumbers, btnPause, actionBar, actionBarFill,
    } = overlays.elements;

    // Mobile joystick
    const joy = document.getElementById("joy");
    const knob = document.getElementById("knob");
    const isTouch =
      ("ontouchstart" in window) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0) ||
      (window.matchMedia && window.matchMedia("(any-pointer: coarse)").matches) ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
    if (isTouch) { joy.style.display = "none"; }

    const isPauseToggleBlocked = () =>
      (pickerOverlay.style.display === "grid") ||
      (startOverlay.style.display === "grid") ||
      (mainMenuOverlay.style.display === "grid") ||
      (gameoverOverlay.style.display === "grid") ||
      (recordsOverlay.style.display === "grid") ||
      (settingsOverlay.style.display === "grid") ||
      (restartConfirmOverlay.style.display === "grid");
    const updatePauseBtnVisibility = () => {
      btnPause.style.display = isPauseToggleBlocked() ? "none" : "block";
    };

    const minDim = Math.min(innerWidth, innerHeight);
    const GAME_SCALE = (isTouch && minDim <= 640) ? 0.5 : 1;
    const SPAWN_SCALE = 1 / GAME_SCALE;
    const MAX_DPR = 2
    let cameraScale = GAME_SCALE;

    const { ctx, getDpr } = initCanvas(canvas, GAME_SCALE, MAX_DPR);


    // Simple circle batching to reduce per-entity beginPath/fill calls
    const batch = createRenderBatch();

    // roundRect polyfill
    ensureRoundRectPolyfill();

    // Input
    const keys = new Set();
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    function triggerAction(){
      if (state.paused || state.dead) return;
      if (hasUnique("max_shirt")) tryActivateMaxShirt();
      if (hasUnique("british_citizenship")) triggerDash();
    }
    addEventListener("keydown",(e)=>{
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();

      if (e.code==="Escape"){
        if (restartConfirmOverlay.style.display === "grid"){
          hideRestartConfirm();
          return;
        }
        if (settingsOverlay.style.display === "grid"){
          hideSettings();
          return;
        }
        if (recordsOverlay.style.display === "grid"){
          hideRecords();
          return;
        }
        if (pickerOverlay.style.display==="grid" || startOverlay.style.display==="grid" || mainMenuOverlay.style.display==="grid" || gameoverOverlay.style.display==="grid" || restartConfirmOverlay.style.display==="grid") return;
        togglePauseMenu();
        return;
      }

      if (pickerOverlay.style.display==="grid"){
        if (e.key==="1") pickChoice(0);
        if (e.key==="2") pickChoice(1);
        if (e.key==="3") pickChoice(2);
        if (e.key.toLowerCase()==="r") doReroll();
      }

      if (e.code === "Space"){
        if (pickerOverlay.style.display==="grid" || startOverlay.style.display==="grid" || mainMenuOverlay.style.display==="grid" || gameoverOverlay.style.display==="grid" || pauseMenu.style.display==="grid" || restartConfirmOverlay.style.display==="grid") return;
        triggerAction();
      }

      keys.add(e.code);
    }, { passive:false });
    addEventListener("keyup",(e)=>keys.delete(e.code), { passive:true });

    // Mobile joystick
    let joyActive = false;
    let joyVec = { x: 0, y: 0 };
    let joyCenter = { x: 0, y: 0 };
    const joyRadius = 70;

    if (isTouch){

// virtual joystick appears where you touch (left side)
let joyPointerId = null;

const overlaysBlockInput = () =>
  (pickerOverlay.style.display === "grid") ||
  (startOverlay.style.display === "grid") ||
  (mainMenuOverlay.style.display === "grid") ||
  (gameoverOverlay.style.display === "grid") ||
  (pauseMenu.style.display === "grid") ||
  (recordsOverlay.style.display === "grid") ||
  (settingsOverlay.style.display === "grid") ||
  (restartConfirmOverlay.style.display === "grid");

function placeJoystick(cx, cy){
  // keep fully on-screen
  const x = clamp(cx, JOY_HALF + JOY_MARGIN, innerWidth - JOY_HALF - JOY_MARGIN);
  const y = clamp(cy, JOY_HALF + JOY_MARGIN, innerHeight - JOY_HALF - JOY_MARGIN);
  joy.style.left = `${x}px`;
  joy.style.top  = `${y}px`;
}

function joyMove(px, py){
  const dx = px - joyCenter.x;
  const dy = py - joyCenter.y;
  const d = len2(dx, dy) || 1;
  const m = Math.min(1, d / joyRadius);
  joyVec.x = (dx / d) * m;
  joyVec.y = (dy / d) * m;

  const ox = joyVec.x * (joyRadius*0.70);
  const oy = joyVec.y * (joyRadius*0.70);
  knob.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`;
}

function joyReset(){
  joyActive = false;
  joyPointerId = null;
  joyVec.x = 0; joyVec.y = 0;
  knob.style.transform = `translate(-50%, -50%)`;
  joy.style.display = "none";
}

canvas.addEventListener("pointerdown", (e)=>{
  // only for touch/pen
  if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
  if (overlaysBlockInput()) return;

  // не давать стартовать джойстик при тапе по кнопке паузы (и другим UI при желании)
  if (e.target.closest("#btnPause")) return;
  if (hasAnyActionSkill()){
    const now = performance.now();
    const dtTap = now - lastTapTime;
    const dx = e.clientX - lastTapX;
    const dy = e.clientY - lastTapY;
    const distSq = len2Sq(dx, dy);
    if (dtTap < 280 && distSq < 40 * 40){
      triggerAction();
      lastTapTime = 0;
    } else {
      lastTapTime = now;
      lastTapX = e.clientX;
      lastTapY = e.clientY;
    }
  }

  joyPointerId = e.pointerId;
  canvas.setPointerCapture(e.pointerId);

  // joystick center = initial touch point
  joyCenter.x = e.clientX;
  joyCenter.y = e.clientY;

  placeJoystick(e.clientX, e.clientY);
  joy.style.display = "block";
  joyActive = true;
  joyMove(e.clientX, e.clientY);
}, { passive:true });

canvas.addEventListener("pointermove", (e)=>{
  if (!joyActive || joyPointerId !== e.pointerId) return;
  joyMove(e.clientX, e.clientY);
}, { passive:true });

canvas.addEventListener("pointerup", (e)=>{
  if (joyPointerId !== e.pointerId) return;
  joyReset();
}, { passive:true });

canvas.addEventListener("pointercancel", (e)=>{
  if (joyPointerId !== e.pointerId) return;
  joyReset();
}, { passive:true });

    }

    // Pause button
    btnPause.addEventListener("click", (e)=>{
      e.preventDefault();
      if (isPauseToggleBlocked()) return;
      togglePauseMenu();
    });

    // State
    const { player, state, ui, entities, spawn } = initState();
    const {
      bullets,
      enemyBullets,
      enemies,
      turrets,
      drops,
      particles,
      shockwaves,
      floaters,
      dashTrail,
      lightningStrikes,
      clones,
      dogs,
      chests,
      totem,
    } = entities;
    const { gridBuild, gridQueryCircle } = createSpatialGrid(enemies);

    // Storage + options
    const { options, applyOptionsToUI } = bindOptionsUI({ optShowDamageNumbers });

    function getDashDir(dirX, dirY){
      if (Number.isFinite(dirX) && Number.isFinite(dirY) && (dirX !== 0 || dirY !== 0)){
        const d = len2(dirX, dirY) || 1;
        return { x: dirX / d, y: dirY / d };
      }
      let ix = 0, iy = 0;
      if (keys.has("KeyW") || keys.has("ArrowUp")) iy -= 1;
      if (keys.has("KeyS") || keys.has("ArrowDown")) iy += 1;
      if (keys.has("KeyA") || keys.has("ArrowLeft")) ix -= 1;
      if (keys.has("KeyD") || keys.has("ArrowRight")) ix += 1;
      if (isTouch){ ix += joyVec.x; iy += joyVec.y; }
      const ilen = len2(ix, iy);
      if (ilen > 0.2) return { x: ix / ilen, y: iy / ilen };
      const spd = len2(player.vx, player.vy);
      if (spd > 1) return { x: player.vx / spd, y: player.vy / spd };
      const ld = len2(player.lastDirX || 0, player.lastDirY || 0) || 1;
      return { x: (player.lastDirX || 1) / ld, y: (player.lastDirY || 0) / ld };
    }
    function triggerDash(dirX, dirY){
      if (!hasUnique("british_citizenship")) return false;
      if (player.dashCd > 0 || state.dashT > 0) return false;
      const dir = getDashDir(dirX, dirY);
      const ux = dir.x;
      const uy = dir.y;
      const dashSpeed = DASH_DISTANCE / DASH_DURATION;
      state.dashT = DASH_DURATION;
      state.dashVx = ux * dashSpeed;
      state.dashVy = uy * dashSpeed;
      player.vx = state.dashVx;
      player.vy = state.dashVy;
      player.invuln = Math.max(player.invuln, DASH_INVULN);
      player.dashCd = DASH_COOLDOWN;
      state.dashTrailT = 0;
      spawnDashTrail();
      return true;
    }
    function tryActivateMaxShirt(){
      if (!hasUnique("max_shirt")) return false;
      if (state.maxShirtCd > 0 || state.maxShirtSlowT > 0) return false;
      state.maxShirtSlowT = MAX_SHIRT_SLOW_DURATION;
      state.maxShirtCd = MAX_SHIRT_COOLDOWN;
      return true;
    }
    function tryActivatePatriarchDoll(){
      if (!hasUnique("patriarch_doll")) return false;
      if (state.patriarchDollCd > 0) return false;
      const alive = [];
      const range = Math.min(800, 380 + player.lvl * 4);
      const range2 = range * range;
      for (const e of enemies){
        if (!e || e.dead || e.dying) continue;
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        if ((dx * dx + dy * dy) > range2) continue;
        alive.push(e);
      }
      if (!alive.length) return false;
      const hits = Math.min(randi(PATRIARCH_DOLL_TARGETS_MIN, PATRIARCH_DOLL_TARGETS_MAX), alive.length);
      const baseDmg = player.damage * PATRIARCH_DOLL_DAMAGE_MULT;
      for (let i=0; i<hits; i++){
        const idx = randi(i, alive.length - 1);
        const tmp = alive[i];
        alive[i] = alive[idx];
        alive[idx] = tmp;
        const e = alive[i];
        spawnLightningStrike(e.x, e.y);
        let dmg = baseDmg;
        if (e.type === "shield") dmg *= 0.65;
        e.hp -= dmg;
        e.hitFlash = Math.max(e.hitFlash, 0.12);
        recordDamage(dmg, e.x, e.y);
        burst(e.x, e.y, randi(8, 12), 260, 0.25);
        if (e.hp <= 0) killEnemy(e);
      }
      state.patriarchDollCd = PATRIARCH_DOLL_COOLDOWN;
      return true;
    }

    const UNIQUES = createUniques({
      player,
      state,
      totem,
      spawnDog,
    });
    const uniquesList = Object.keys(UNIQUES);

    const {
      getBaseMoveSpeed,
      getChestInterval,
      getLevel,
      getMoveSpeed,
      getOrbitalSize,
      getRicochetBounces,
      getTotemInterval,
      getTurretAggroRadius,
      getTurretChance,
      getTurretDamage,
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
    } = createPlayerFunctions({
      player,
      totem,
      uniques: UNIQUES,
      uniquesList,
    });

    // Characters

    function maybeAddStartingDog(heroId){
      const hero = getPlayerClass(heroId);
      const chance = hero ? (hero.dogStartChance || 0) : 0;
      if (chance > 0 && Math.random() < chance) addUniqueItem("dog");
    }

    function openMainMenu(){
      state.paused = true;
      mainMenuOverlay.style.display = "grid";
      updatePauseBtnVisibility();
    }

    function openStart(){
      state.paused = true;
      mainMenuOverlay.style.display = "none";
      startOverlay.style.display = "grid";
      updatePauseBtnVisibility();
      charsWrap.innerHTML = "";
      PLAYER_CLASSES.forEach((c)=>{
        const div = document.createElement("div");
        div.className = "choice";
        div.innerHTML = `<div class="t">${c.name}</div><div class="d">${c.desc}</div><div class="d" style="margin-top:8px; opacity:.75">${c.perk}</div>`;
        div.addEventListener("click", ()=>{
          c.apply(player);
          maybeAddStartingDog(c.id);
          startOverlay.style.display = "none";
          state.paused = false;
          updatePauseBtnVisibility();
        });
        charsWrap.appendChild(div);
      });
    }

    btnFreePlay.addEventListener("click", ()=>{
      mainMenuOverlay.style.display = "none";
      openStart();
    });
    btnMenuRecords.addEventListener("click", ()=>showRecords());
    if (btnMenuSettings) btnMenuSettings.addEventListener("click", ()=>showSettings());
    if (btnSettings) btnSettings.addEventListener("click", ()=>showSettings());
    if (btnSettingsClose) btnSettingsClose.addEventListener("click", hideSettings);

    // Drops/particles
    function dropXp(x,y,amount){
      const n = Math.max(1, Math.round(amount/10));
      for(let i=0;i<n;i++){
        drops.push({
          x: x + randf(-10,10),
          y: y + randf(-10,10),
          r: 6,
          v: (amount / n),
          vx: randf(-60,60),
          vy: randf(-60,60),
          t: 0,
          kind: "xp",
        });
      }
    }
    function dropHeal(x,y,amount){
      drops.push({
        x: x + randf(-8,8),
        y: y + randf(-8,8),
        r: 7,
        v: amount,
        vx: randf(-50,50),
        vy: randf(-50,50),
        t: 0,
        kind: "heal",
        life: 60,
        pulse: randf(0, TAU),
      });
    }
    function queueHeal(amount){
      if (amount <= 0) return;
      if (player.hp >= player.hpMax) return;
      state.healQueue.push({ amount, t: 0 });
    }
    function updateHeal(dt){
      if (player.hp >= player.hpMax){
        state.healActive = null;
        state.healQueue.length = 0;
        return;
      }
      if (!state.healActive && state.healQueue.length){
        state.healActive = state.healQueue.shift();
      }
      const h = state.healActive;
      if (!h) return;
      const step = Math.min(dt, HEAL_OVER_TIME - h.t);
      if (step > 0){
        player.hp = Math.min(player.hpMax, player.hp + h.amount * (step / HEAL_OVER_TIME));
      }
      h.t += step;
      if (h.t >= HEAL_OVER_TIME || player.hp >= player.hpMax){
        state.healActive = null;
      }
    }
    function burst(x,y,count,spd,life){
      for(let i=0;i<count;i++){
        const a = randf(0,TAU);
        particles.push({
          x,y,
          vx: Math.cos(a)*randf(spd*0.4, spd),
          vy: Math.sin(a)*randf(spd*0.4, spd),
          r: randf(1.5,3.5),
          life: randf(life*0.6, life),
          t: 0,
        });
      }
    }
    function spawnShockwave(x,y,r0,r1,life,color){
      shockwaves.push({
        x,y,
        r0,r1,
        life,
        t:0,
        color: color || "rgba(200,230,255,0.95)",
      });
    }
    function spawnDashTrail(){
      dashTrail.push({
        x: player.x,
        y: player.y,
        r: player.r * 0.95,
        t: 0,
        life: DASH_TRAIL_LIFE,
      });
      if (dashTrail.length > DASH_TRAIL_MAX) dashTrail.shift();
    }
    function spawnLightningStrike(x,y){
      const height = randf(LIGHTNING_STRIKE_HEIGHT_MIN, LIGHTNING_STRIKE_HEIGHT_MAX);
      const topY = y - height;
      const segments = randi(LIGHTNING_STRIKE_SEGMENTS_MIN, LIGHTNING_STRIKE_SEGMENTS_MAX);
      const pts = [{ x, y: topY }];
      for (let i=1; i<segments; i++){
        const t = i / segments;
        const px = x + randf(-LIGHTNING_STRIKE_JITTER, LIGHTNING_STRIKE_JITTER);
        const py = topY + (y - topY) * t;
        pts.push({ x: px, y: py });
      }
      pts.push({ x, y });
      lightningStrikes.push({ pts, x, y, t: 0, life: LIGHTNING_STRIKE_LIFE });
    }
    function spawnHealFloat(amount){
      const value = Math.round(amount);
      if (value <= 0) return;
      floaters.push({
        x: player.x + randf(-10, 10),
        y: player.y + randf(-12, 0),
        vx: randf(-18, 18),
        vy: randf(-50, -30),
        t: 0,
        life: 0.9,
        text: `+${value}`,
        color: "rgba(120,255,140,0.95)",
      });
    }
    function spawnDamageFloat(amount, x, y, color, size){
      const value = Math.round(amount);
      if (value <= 0) return;
      const bx = Number.isFinite(x) ? x : player.x;
      const by = Number.isFinite(y) ? y : player.y;
      floaters.push({
        x: bx + randf(-10, 10),
        y: by + randf(-16, -4),
        vx: randf(-22, 22),
        vy: randf(-70, -50),
        t: 0,
        life: 0.9,
        text: `-${value}`,
        color: color || "rgba(220,60,60,0.95)",
        size: Number.isFinite(size) ? size : null,
      });
    }

    function recordDamage(amount, x, y, showNumber=false, color=null, size=null){
      state.dmgDone += amount;
      if (options.showDamageNumbers && showNumber && Number.isFinite(x) && Number.isFinite(y)){
        spawnDamageFloat(amount, x, y, color, size);
      }
      // lifesteal
      if (player.lifeSteal > 0 && amount > 0){
        const minLsDamage = player.hpMax * 0.08;
        if (amount > minLsDamage){
          const chance = 0.01 * player.lifeSteal;
          if (Math.random() < chance){
            const before = player.hp;
            player.hp = Math.min(player.hpMax, player.hp + player.hpMax * 0.01);
            const healed = player.hp - before;
            if (healed > 0) spawnHealFloat(healed);
          }
        }
      }
      state.lastDmgWindow.push([state.t, amount]);
      const cutoff = state.t - 2;
      while(state.lastDmgWindow.length && state.lastDmgWindow[0][0] < cutoff) state.lastDmgWindow.shift();
    }
    function enemyLabel(type, bossKind){
      if (type === "boss" && bossKind) return `boss:${bossKind}`;
      return type || "enemy";
    }
    function setDeathReason(reason){
      if (!state.deathReason) state.deathReason = reason;
    }
    function getDps(){
      const cutoff = state.t - 2;
      let sum = 0;
      for(const [t,a] of state.lastDmgWindow) if (t >= cutoff) sum += a;
      return Math.round(sum / 2);
    }
    function applyDamageToPlayer(raw){
      if (raw <= 0) return 0;
      if (state.dead) return 0;

      // на всякий случай (у тебя обычно проверка invuln снаружи)
      if (player.invuln > 0) return 0;

      // dodge
      if (player.dodge > 0 && Math.random() < player.dodge) return 0;

      // armor cap 60%
      const arm = clamp(player.armor, 0, 0.60);
      const dmg = raw * (1 - arm) * player.damageTakenMult;

      player.hp -= dmg;
      if (player.hp < 0) player.hp = 0;
      if (options.showDamageNumbers) spawnDamageFloat(dmg, player.x, player.y);

      return dmg;
    }
    function tryConsumeSpareTire(){
      if (!hasUnique("spare_tire")) return false;
      player.uniques.delete("spare_tire");
      const reviveHp = Math.max(1, Math.ceil(player.hpMax * 0.25));
      player.hp = reviveHp;
      player.invuln = Math.max(player.invuln, 1.2);
      burst(player.x, player.y, randi(14,18), 240, 0.45);
      if (pauseMenu.style.display === "grid") updateBuildUI();
      return true;
    }
    function handlePlayerDeath(reason){
      if (tryConsumeSpareTire()) return false;
      player.hp = 0;
      if (reason) setDeathReason(reason);
      gameOver();
      return true;
    }


    function gainXp(v){
      const mult = player.xpGainMult * (1 + (state.xpEnemyBonus || 0));
      player.xp += v * mult;
      while(player.xp >= player.xpNeed && !state.dead){
        player.xp -= player.xpNeed;
        player.lvl += 1;
        player.xpNeed = Math.floor(player.xpNeed * 1.12 * player.xpNeedMult + 8);
        state.chestTimer = Math.min(state.chestTimer, getChestInterval());
        state.pendingLevelUps += 1;
      }
      maybeOpenLevelPicker();
    }

    // Enemies
    const spawnEnemy = createSpawnEnemy({
      player,
      state,
      enemies,
      spawnScale: SPAWN_SCALE,
    });

    const spawnBoss = createSpawnBoss({
      spawn,
      spawnEnemy,
      bossWrap,
    });

    const spawnColossusElite = createSpawnColossusElite({
      player,
      state,
      spawnEnemy,
    });

    // Chest
    const spawnChest = createSpawnChest({
      state,
      chests,
      totem,
      player,
      hasRemainingUnique,
    });
    function pickUpChest(){
      if (!chests.length) { state.chestAlive = false; return; }
      const c = chests[0];
      chests.length = 0;
      state.chestAlive = false;
      if (player.chestBonusReroll > 0){
        player.rerolls = Math.min(player.rerollCap, player.rerolls + player.chestBonusReroll);
      }
      openUpgradePicker(c && c.special ? "unique" : "chest");
    }

    // Totem
    function getTotemLife(lv = player.lvl){
      const bonus = Math.floor(Math.max(0, lv) / TOTEM_LIFE_LV_STEP) * TOTEM_LIFE_STEP;
      return Math.min(TOTEM_LIFE_CAP, TOTEM_LIFE_BASE + bonus);
    }
    function getInvulnDuration(base, min, lv = player.lvl){
      const steps = Math.floor(Math.max(0, lv) / INVULN_LV_STEP);
      return Math.max(min, base - steps * INVULN_STEP);
    }
    function getInvulnAfterHit(base){
      if (player.heroId === "tank") return base + Math.min(base * 0.3, TANK_INVULN_BONUS_CAP);
      return base;
    }
    function getTotemEffectGain(lv = player.lvl){
      const bonus = Math.floor(Math.max(0, lv) / TOTEM_EFFECT_GAIN_LV_STEP) * TOTEM_EFFECT_GAIN_STEP;
      return Math.min(TOTEM_EFFECT_GAIN_CAP, TOTEM_EFFECT_GAIN_BASE + bonus);
    }
    function getTotemDpsRamp(lv = player.lvl){
      const steps = Math.floor(Math.max(0, lv) / TOTEM_DPS_RAMP_LV_STEP);
      return Math.min(TOTEM_DPS_RAMP_CAP, TOTEM_DPS_RAMP_BASE * Math.pow(TOTEM_DPS_RAMP_GROWTH, steps));
    }
    const spawnTotem = createSpawnTotem({
      player,
      totem,
      hasUnique,
      getTotemLife,
    });

    // Targeting
    function findNearestEnemy(){
      let best = null, bestD = Infinity;
      for (const e of enemies){
        if (e.dead || e.dying) continue;
        if (e.type==="boss"){
          const d = (e.x-player.x)**2 + (e.y-player.y)**2;
          if (d < bestD*1.1){ bestD = d; best = e; }
        }
      }
      for (const e of enemies){
        if (e.dead || e.dying) continue;
        if (e.type==="boss") continue;
        const d = (e.x-player.x)**2 + (e.y-player.y)**2;
        if (d < bestD){ bestD = d; best = e; }
      }
      return best;
    }
    function findNearestEnemyFrom(x, y){
      let best = null, bestD = Infinity;
      for (const e of enemies){
        if (e.dead || e.dying) continue;
        if (e.type==="boss"){
          const d = (e.x-x)**2 + (e.y-y)**2;
          if (d < bestD*1.1){ bestD = d; best = e; }
        }
      }
      for (const e of enemies){
        if (e.dead || e.dying) continue;
        if (e.type==="boss") continue;
        const d = (e.x-x)**2 + (e.y-y)**2;
        if (d < bestD){ bestD = d; best = e; }
      }
      return best;
    }
    function findNearestEnemyTo(x, y, range){
      const candidates = [];
      gridQueryCircle(x, y, range, candidates);
      let best = null;
      let bestD = Infinity;
      for (const e of candidates){
        if (e.dead || e.dying) continue;
        const d = (e.x - x) ** 2 + (e.y - y) ** 2;
        if (d < bestD){ bestD = d; best = e; }
      }
      return best;
    }
    function findRicochetTarget(x, y, excludeId, excludeId2){
      const candidates = [];
      gridQueryCircle(x, y, 260, candidates);
      let best = null;
      let bestD = Infinity;
      for (const e of candidates){
        if (e.dead || e.dying) continue;
        if (e.id === excludeId || e.id === excludeId2) continue;
        const d = (e.x - x) ** 2 + (e.y - y) ** 2;
        if (d < bestD){ bestD = d; best = e; }
      }
      return best;
    }
    function findRicochetTargetWithinAngle(x, y, excludeId, excludeId2, excludeId3, baseAng, maxDelta){
      const candidates = [];
      gridQueryCircle(x, y, 260, candidates);
      let best = null;
      let bestD = Infinity;
      for (const e of candidates){
        if (e.dead || e.dying) continue;
        if (e.id === excludeId || e.id === excludeId2 || e.id === excludeId3) continue;
        const ang = Math.atan2(e.y - y, e.x - x);
        let dAng = Math.abs(ang - baseAng) % TAU;
        if (dAng > Math.PI) dAng = TAU - dAng;
        if (dAng > maxDelta) continue;
        const d = (e.x - x) ** 2 + (e.y - y) ** 2;
        if (d < bestD){ bestD = d; best = e; }
      }
      return best;
    }
    function spawnCheapRicochetSplits(b, hitEnemy, target, spd, baseAng){
      const ricochetLeft = Math.max(0, (b.ricochetLeft || 0) - 1);
      const shrink = 0.707;
      const dmgShrink = 0.56;
      const newR = b.r * shrink;
      const newDmg = b.dmg * dmgShrink;
      const newBaseDmg = (b.baseDmg || b.dmg) * dmgShrink;
      const maxSpread = Math.PI / 3; // <= 60°
      const target2 = findRicochetTargetWithinAngle(
        hitEnemy.x, hitEnemy.y,
        target.id, hitEnemy.id, b.lastHitId,
        baseAng, maxSpread
      );
      const ang2 = target2
        ? Math.atan2(target2.y - hitEnemy.y, target2.x - hitEnemy.x)
        : (baseAng + randf(-maxSpread, maxSpread));
      const spawnSplit = (ang)=>{
        const hitIds = b.hitIds ? new Set(b.hitIds) : null;
        bullets.push({
          x: hitEnemy.x + Math.cos(ang) * (hitEnemy.r + newR + 2),
          y: hitEnemy.y + Math.sin(ang) * (hitEnemy.r + newR + 2),
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          r: newR,
          dmg: newDmg,
          baseDmg: newBaseDmg,
          pierce: b.pierce,
          life: b.life,
          t: b.t,
          isNova: b.isNova,
          ricochetLeft,
          ricochetChance: b.ricochetChance,
          lastHitId: hitEnemy.id,
          hitIds,
        });
      };
      spawnSplit(baseAng);
      spawnSplit(ang2);
    }
    function getEnemyTarget(e){
      if (e.type === "boss") return { x: player.x, y: player.y, turret: null };
      const aggro = getTurretAggroRadius();
      let best = null;
      let bestD = Infinity;
      if (aggro > 0){
        const aggro2 = aggro * aggro;
        for (const t of turrets){
          const dx = t.x - e.x;
          const dy = t.y - e.y;
          const d = dx*dx + dy*dy;
          if (d <= aggro2 && d < bestD){
            bestD = d;
            best = t;
          }
        }
      }
      if (best) return { x: best.x, y: best.y, turret: best };
      return { x: player.x, y: player.y, turret: null };
    }

    // Shooting (bullet life doubled)
    function shoot(dt){
      player.shotTimer -= dt;
      if (player.shotTimer > 0) return;
      const target = findNearestEnemy();
      if (!target) return;

      const baseAngle = Math.atan2(target.y-player.y, target.x-player.x);
      const shots = player.multishot;
      // For 2-shot, force 0.16 rad between bullets (spread is half of that).
      const spread = (shots === 2) ? 0.08 : player.spread;

      for(let i=0;i<shots;i++){
        const t = (shots===1) ? 0 : (i/(shots-1))*2 - 1;
        const a = baseAngle + t*spread + randf(-0.01,0.01);
        bullets.push({
          x: player.x, y: player.y,
          vx: Math.cos(a)*player.bulletSpeed,
          vy: Math.sin(a)*player.bulletSpeed,
          r: player.bulletSize,
          dmg: player.damage * getWoundedDamageMult(),
          baseDmg: player.damage * getWoundedDamageMult(),
          pierce: player.pierce,
          life: 3.2, // было 1.6
          t: 0,
          ricochetLeft: getRicochetBounces(),
          ricochetChance: player.ricochetChance,
          lastHitId: null,
        });
      }
      if (getTurretChance() > 0 && Math.random() < getTurretChance()) spawnTurret();
      player.shotTimer = 1 / player.fireRate;
    }

    function shootNova(dt){
      if (player.novaCount <= 0) return;
      player.novaTimer -= dt;
      if (player.novaTimer > 0) return;

      const shots = Math.max(1, player.novaCount * 3);
      const offset = randf(0, TAU);
      for(let i=0;i<shots;i++){
        const a = offset + i*(TAU/shots);
        bullets.push({
          x: player.x, y: player.y,
          vx: Math.cos(a)*player.novaSpeed,
          vy: Math.sin(a)*player.novaSpeed,
          r: Math.max(4, player.bulletSize * 1.15),
          dmg: player.novaDamage * getWoundedDamageMult(),
          baseDmg: player.novaDamage * getWoundedDamageMult(),
          pierce: 1,
          life: 3.0,
          t: 0,
          isNova: true,
          ricochetLeft: getRicochetBounces(),
          ricochetChance: player.ricochetChance,
          lastHitId: null,
        });
      }
      player.novaTimer = 1 / player.novaRate;
    }

    function cloneShoot(c, dt){
      c.shotTimer -= dt;
      if (c.shotTimer > 0) return;
      const target = findNearestEnemyFrom(c.x, c.y);
      if (!target) return;

      const baseAngle = Math.atan2(target.y - c.y, target.x - c.x);
      const shots = player.multishot;
      const spread = (shots === 2) ? 0.08 : player.spread;

      for(let i=0;i<shots;i++){
        const t = (shots===1) ? 0 : (i/(shots-1))*2 - 1;
        const a = baseAngle + t*spread + randf(-0.01,0.01);
        bullets.push({
          x: c.x, y: c.y,
          vx: Math.cos(a)*player.bulletSpeed,
          vy: Math.sin(a)*player.bulletSpeed,
          r: player.bulletSize,
          dmg: player.damage * getWoundedDamageMult(),
          baseDmg: player.damage * getWoundedDamageMult(),
          pierce: player.pierce,
          life: 3.2,
          t: 0,
          ricochetLeft: getRicochetBounces(),
          ricochetChance: player.ricochetChance,
          lastHitId: null,
        });
      }
      c.shotTimer = 1 / player.fireRate;
    }

    function cloneShootNova(c, dt){
      if (player.novaCount <= 0) return;
      c.novaTimer -= dt;
      if (c.novaTimer > 0) return;

      const shots = Math.max(1, player.novaCount * 3);
      const offset = randf(0, TAU);
      for(let i=0;i<shots;i++){
        const a = offset + i*(TAU/shots);
        bullets.push({
          x: c.x, y: c.y,
          vx: Math.cos(a)*player.novaSpeed,
          vy: Math.sin(a)*player.novaSpeed,
          r: Math.max(4, player.bulletSize * 1.15),
          dmg: player.novaDamage * getWoundedDamageMult(),
          baseDmg: player.novaDamage * getWoundedDamageMult(),
          pierce: 1,
          life: 3.0,
          t: 0,
          isNova: true,
          ricochetLeft: getRicochetBounces(),
          ricochetChance: player.ricochetChance,
          lastHitId: null,
        });
      }
      c.novaTimer = 1 / player.novaRate;
    }

    function spawnTurret(){
      if (getTurretLevel() <= 0) return;
      if (turrets.length >= getTurretMax()) return;
      const a = randf(0, TAU);
      const d = randf(TURRET_MIN_DIST, TURRET_SPAWN_RADIUS);
      const x = player.x + Math.cos(a) * d;
      const y = player.y + Math.sin(a) * d;
      const size = getTurretSize();
      const hpMax = getTurretHpMax();
      turrets.push({
        x, y,
        r: size * 0.5,
        size,
        hpMax,
        hp: hpMax,
        shotTimer: randf(0, 0.4),
        hitCd: 0,
      });
    }

    function updateTurrets(dt){
      for (let i=turrets.length-1; i>=0; i--){
        const t = turrets[i];
        const size = getTurretSize();
        const hpMax = getTurretHpMax();
        t.size = size;
        t.r = size * 0.5;
        if (t.hpMax !== hpMax){
          const delta = hpMax - t.hpMax;
          t.hpMax = hpMax;
          t.hp = Math.min(hpMax, t.hp + delta);
        }
        t.hitCd = Math.max(0, t.hitCd - dt);
        if (t.hp <= 0){ turrets.splice(i,1); continue; }

        t.shotTimer -= dt;
        if (t.shotTimer <= 0){
          const target = findNearestEnemyTo(t.x, t.y, TURRET_RANGE);
          if (target){
            const ang = Math.atan2(target.y - t.y, target.x - t.x);
            bullets.push({
              x: t.x, y: t.y,
              vx: Math.cos(ang) * TURRET_BULLET_SPEED,
              vy: Math.sin(ang) * TURRET_BULLET_SPEED,
              r: TURRET_BULLET_SIZE,
              dmg: getTurretDamage(),
              baseDmg: getTurretDamage(),
              pierce: 1,
              life: 2.6,
              t: 0,
              ricochetLeft: getRicochetBounces(),
              ricochetChance: player.ricochetChance,
              lastHitId: null,
            });
          }
          t.shotTimer = 1 / getTurretFireRate();
        }
      }
    }

    // Orbitals/Aura
    let orbitalAngle = 0;
    function updateOrbitals(dt){
      if (player.orbitals <= 0) return;
      orbitalAngle += player.orbitalSpeed * dt;
      const candidates = [];
      const orbSize = getOrbitalSize();

      for(let k=0;k<player.orbitals;k++){
        const a = orbitalAngle + (k/Math.max(1,player.orbitals))*TAU;
        const ox = player.x + Math.cos(a)*player.orbitalRadius;
        const oy = player.y + Math.sin(a)*player.orbitalRadius;

        gridQueryCircle(ox, oy, orbSize + ENEMY_MAX_R, candidates);
        for (let i=candidates.length-1; i>=0; i--){
          const e = candidates[i];
          if (e.dead || e.dying) continue;
          if (!e._oh) e._oh = new Float32Array(24);
          e._oh[k] = Math.max(0, (e._oh[k]||0) - dt);
          if (e._oh[k] > 0) continue;

          if (circleHit(ox,oy, orbSize, e.x,e.y,e.r)){
            e._oh[k] = player.orbitalHitCD;
            const dmg = player.orbitalDamage * getWoundedDamageMult();
            e.hp -= dmg;
            e.hitFlash = 0.09;
            recordDamage(dmg, e.x, e.y);

            if (Math.random() < ORBITAL_KNOCKBACK_CHANCE){
              const dx = e.x-ox, dy = e.y-oy;
              const d = len2(dx,dy) || 1;
              e.vx += (dx/d) * ORBITAL_KNOCKBACK_FORCE;
              e.vy += (dy/d) * ORBITAL_KNOCKBACK_FORCE;
            }

            if (e.hp <= 0) killEnemy(e);
          }
        }
      }
    }

    function pickDogColor(){
      if (Math.random() < DOG_GRAY_CHANCE) return DOG_GRAY_COLOR;
      return DOG_BROWN_COLORS[Math.floor(Math.random() * DOG_BROWN_COLORS.length)];
    }

    function getDogAttackRange(){
      return player.magnet * 1.25;
    }

    function spawnDog(){
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
    }

    function pickDogTarget(excludeId){
      const candidates = [];
      const range = getDogAttackRange();
      gridQueryCircle(player.x, player.y, range + ENEMY_MAX_R, candidates);
      let valid = 0;
      let choice = null;
      for (const e of candidates){
        if (!e || e.dead || e.dying) continue;
        if (excludeId && e.id === excludeId) continue;
        const dx = e.x - player.x;
        const dy = e.y - player.y;
        if ((dx*dx + dy*dy) > range*range) continue;
        valid += 1;
        if (Math.random() < 1 / valid) choice = e;
      }
      return choice;
    }

    function updateDogs(dt){
      if (!dogs.length) return;
      for (const dog of dogs){
        dog.hitCd = Math.max(0, dog.hitCd - dt);
        if (!dog.target || dog.target.dead || dog.target.dying){
          dog.target = pickDogTarget();
        }

        let tx = player.x;
        let ty = player.y;
        if (dog.target){
          tx = dog.target.x;
          ty = dog.target.y;
        } else if (hasUnique("baltika9")){
          const dxp = dog.x - player.x;
          const dyp = dog.y - player.y;
          const avoid = DOG_BALTIKA_AVOID_R;
          if ((dxp*dxp + dyp*dyp) < avoid*avoid){
            if (dxp === 0 && dyp === 0){
              tx = dog.x + Math.cos(dog.ang);
              ty = dog.y + Math.sin(dog.ang);
            } else {
              tx = dog.x + dxp;
              ty = dog.y + dyp;
            }
          }
        }

        const desired = Math.atan2(ty - dog.y, tx - dog.x);
        let delta = desired - dog.ang;
        while (delta > Math.PI) delta -= TAU;
        while (delta < -Math.PI) delta += TAU;
        const maxTurn = DOG_TURN_RATE * dt;
        delta = clamp(delta, -maxTurn, maxTurn);
        dog.ang += delta;

        const speed = dog.target ? DOG_SPEED * 1.25 : DOG_SPEED;
        const vx = Math.cos(dog.ang) * speed;
        const vy = Math.sin(dog.ang) * speed;
        dog.x += vx * dt;
        dog.y += vy * dt;

        if (dog.target && dog.hitCd <= 0 && circleHit(dog.x, dog.y, dog.r, dog.target.x, dog.target.y, dog.target.r)){
          const isCrit = Math.random() < DOG_CRIT_CHANCE;
          let dmg = player.damage * 2 * (isCrit ? player.critMult : 1);
          if (dog.target.type === "shield") dmg *= 0.65;
          dog.target.hp -= dmg;
          dog.target.hitFlash = Math.max(dog.target.hitFlash, 0.09);
          recordDamage(dmg, dog.target.x, dog.target.y, isCrit, "rgba(255,190,90,0.95)");
          if (dog.target.hp <= 0) killEnemy(dog.target);
          const lastId = dog.target.id;
          dog.target = pickDogTarget(lastId);
          dog.hitCd = DOG_HIT_COOLDOWN;
        }
      }
    }
    function applyAura(dt){
      if (!player.aura) return;

      const waveLv = getLevel("auraWave");
      if (waveLv > 0){
        state.auraWaveT -= dt;
        if (state.auraWaveT <= 0){
          state.auraWaveT = getAuraWaveCooldown();
          state.auraWaveActive = true;
          state.auraWaveR = 0;
          state.auraWaveMaxR = player.auraRadius;
          state.auraWaveX = player.x;
          state.auraWaveY = player.y;
          state.auraWaveId += 1;
        }
      }

      const wavePrevR = state.auraWaveR;
      if (state.auraWaveActive){
        const speed = state.auraWaveMaxR / Math.max(0.1, AURA_WAVE_TRAVEL_TIME);
        state.auraWaveR += speed * dt;
        if (state.auraWaveR >= state.auraWaveMaxR + AURA_WAVE_THICKNESS){
          state.auraWaveActive = false;
        }
        state.auraWaveX = player.x;
        state.auraWaveY = player.y;
      }

      const radius = player.auraRadius;
      state.auraTickT -= dt;
      let auraTicks = 0;
      if (state.auraTickT <= 0){
        auraTicks = Math.floor(-state.auraTickT / AURA_TICK_INTERVAL) + 1;
        state.auraTickT += auraTicks * AURA_TICK_INTERVAL;
      }
      if (auraTicks > 0){
        const candidates = [];
        const dmgPerTick = player.auraDps * getWoundedDamageMult() * AURA_TICK_INTERVAL;
        gridQueryCircle(player.x, player.y, radius + ENEMY_MAX_R, candidates);
        for (let i=candidates.length-1; i>=0; i--){
          const e = candidates[i];
          if (e.dead || e.dying) continue;
          const dx = e.x - player.x;
          const dy = e.y - player.y;
          const maxR = radius + e.r;
          if (len2Sq(dx, dy) > maxR * maxR) continue;

          for (let t=0; t<auraTicks; t++){
            if (e.dead || e.dying) break;
            const dmg = dmgPerTick;
            e.hp -= dmg;
            e.auraFlash = Math.max(e.auraFlash || 0, 0.05);
            recordDamage(dmg, e.x, e.y);
            if (player.auraSlow > 0){ e._slowT = Math.max(e._slowT||0, 0.25); e._slowMult = 1 - clamp(player.auraSlow, 0, 0.55); }
            if (e.hp <= 0){ killEnemy(e); break; }
          }
        }
      }

      if (state.auraWaveActive){
        const waveCandidates = [];
        const waveR = state.auraWaveR;
        const minR = Math.min(wavePrevR, waveR);
        const maxR = Math.max(wavePrevR, waveR);
        const waveX = state.auraWaveX;
        const waveY = state.auraWaveY;
        const travel = Math.abs(waveR - wavePrevR);
        const range = maxR + AURA_WAVE_THICKNESS + ENEMY_MAX_R + travel;
        const force = getAuraWaveForce();
        if (force > 0){
          gridQueryCircle(waveX, waveY, range, waveCandidates);
          for (let i=waveCandidates.length-1; i>=0; i--){
            const e = waveCandidates[i];
            if (e.dead || e.dying) continue;
            const lastHit = Number.isFinite(e._auraWaveHitT) ? e._auraWaveHitT : -Infinity;
            if (state.t - lastHit < AURA_WAVE_HIT_COOLDOWN) continue;
            const dx = e.x - waveX;
            const dy = e.y - waveY;
            const dist = len2(dx, dy);
            if (dist > state.auraWaveMaxR) continue;
            const band = AURA_WAVE_THICKNESS + e.r + travel;
            const inner = Math.max(0, minR - band);
            const outer = maxR + band;
            if (dist < inner || dist > outer) continue;

            let mult = 1;
            if (e.type === "boss") mult = AURA_WAVE_BOSS_MULT;
            else if (e.elite) mult = AURA_WAVE_ELITE_MULT;

            const centerR = (minR + maxR) * 0.5;
            const waveBand = clamp(1 - Math.abs(dist - centerR) / Math.max(1, band), 0, 1);
            const smooth = Math.max(0.2, waveBand * waveBand * (3 - 2 * waveBand));
            const push = pushAway(e.x, e.y, waveX, waveY, force * mult * smooth);
            e.x += push.x * AURA_WAVE_POS_MULT;
            e.y += push.y * AURA_WAVE_POS_MULT;
            e.vx += push.x * AURA_WAVE_VEL_MULT;
            e.vy += push.y * AURA_WAVE_VEL_MULT;
            e._auraWaveHitT = state.t;
          }
        }
      }
    }

    function updateCloneOrbitals(c, dt){
      if (player.orbitals <= 0) return;
      c.orbitalAngle = (c.orbitalAngle || 0) + player.orbitalSpeed * dt;
      const candidates = [];
      const orbSize = getOrbitalSize();

      for(let k=0;k<player.orbitals;k++){
        const a = c.orbitalAngle + (k/Math.max(1,player.orbitals))*TAU;
        const ox = c.x + Math.cos(a)*player.orbitalRadius;
        const oy = c.y + Math.sin(a)*player.orbitalRadius;

        gridQueryCircle(ox, oy, orbSize + ENEMY_MAX_R, candidates);
        for (let i=candidates.length-1; i>=0; i--){
          const e = candidates[i];
          if (e.dead || e.dying) continue;
          if (!e._ohClone) e._ohClone = new Float32Array(24);
          e._ohClone[k] = Math.max(0, (e._ohClone[k]||0) - dt);
          if (e._ohClone[k] > 0) continue;

          if (circleHit(ox,oy, orbSize, e.x,e.y,e.r)){
            e._ohClone[k] = player.orbitalHitCD;
            const dmg = player.orbitalDamage * getWoundedDamageMult();
            e.hp -= dmg;
            e.hitFlash = 0.09;
            recordDamage(dmg, e.x, e.y);

            if (Math.random() < ORBITAL_KNOCKBACK_CHANCE){
              const dx = e.x-ox, dy = e.y-oy;
              const d = len2(dx,dy) || 1;
              e.vx += (dx/d) * ORBITAL_KNOCKBACK_FORCE;
              e.vy += (dy/d) * ORBITAL_KNOCKBACK_FORCE;
            }

            if (e.hp <= 0) killEnemy(e);
          }
        }
      }
    }

    function applyCloneAura(c, dt){
      if (!player.aura) return;

      const waveLv = getLevel("auraWave");
      if (waveLv > 0){
        c.auraWaveT -= dt;
        if (c.auraWaveT <= 0){
          c.auraWaveT = getAuraWaveCooldown();
          c.auraWaveActive = true;
          c.auraWaveR = 0;
          c.auraWaveMaxR = player.auraRadius;
          c.auraWaveX = c.x;
          c.auraWaveY = c.y;
          c.auraWaveId = (c.auraWaveId || 0) + 1;
        }
      }

      const wavePrevR = c.auraWaveR || 0;
      if (c.auraWaveActive){
        const speed = c.auraWaveMaxR / Math.max(0.1, AURA_WAVE_TRAVEL_TIME);
        c.auraWaveR += speed * dt;
        if (c.auraWaveR >= c.auraWaveMaxR + AURA_WAVE_THICKNESS){
          c.auraWaveActive = false;
        }
        c.auraWaveX = c.x;
        c.auraWaveY = c.y;
      }

      const radius = player.auraRadius;
      c.auraTickT = Number.isFinite(c.auraTickT) ? c.auraTickT : 0;
      c.auraTickT -= dt;
      let auraTicks = 0;
      if (c.auraTickT <= 0){
        auraTicks = Math.floor(-c.auraTickT / AURA_TICK_INTERVAL) + 1;
        c.auraTickT += auraTicks * AURA_TICK_INTERVAL;
      }
      if (auraTicks > 0){
        const candidates = [];
        const dmgPerTick = player.auraDps * getWoundedDamageMult() * AURA_TICK_INTERVAL;
        gridQueryCircle(c.x, c.y, radius + ENEMY_MAX_R, candidates);
        for (let i=candidates.length-1; i>=0; i--){
          const e = candidates[i];
          if (e.dead || e.dying) continue;
          const dx = e.x - c.x;
          const dy = e.y - c.y;
          const maxR = radius + e.r;
          if (len2Sq(dx, dy) > maxR * maxR) continue;

          for (let t=0; t<auraTicks; t++){
            if (e.dead || e.dying) break;
            const dmg = dmgPerTick;
            e.hp -= dmg;
            e.auraFlash = Math.max(e.auraFlash || 0, 0.05);
            recordDamage(dmg, e.x, e.y);
            if (player.auraSlow > 0){ e._slowT = Math.max(e._slowT||0, 0.25); e._slowMult = 1 - clamp(player.auraSlow, 0, 0.55); }
            if (e.hp <= 0){ killEnemy(e); break; }
          }
        }
      }

      if (c.auraWaveActive){
        const waveCandidates = [];
        const waveR = c.auraWaveR;
        const minR = Math.min(wavePrevR, waveR);
        const maxR = Math.max(wavePrevR, waveR);
        const waveX = c.auraWaveX;
        const waveY = c.auraWaveY;
        const travel = Math.abs(waveR - wavePrevR);
        const range = maxR + AURA_WAVE_THICKNESS + ENEMY_MAX_R + travel;
        const force = getAuraWaveForce();
        if (force > 0){
          gridQueryCircle(waveX, waveY, range, waveCandidates);
          for (let i=waveCandidates.length-1; i>=0; i--){
            const e = waveCandidates[i];
            if (e.dead || e.dying) continue;
            const lastHit = Number.isFinite(e._auraWaveHitT) ? e._auraWaveHitT : -Infinity;
            if (state.t - lastHit < AURA_WAVE_HIT_COOLDOWN) continue;
            const dx = e.x - waveX;
            const dy = e.y - waveY;
            const dist = len2(dx, dy);
            if (dist > c.auraWaveMaxR) continue;
            const band = AURA_WAVE_THICKNESS + e.r + travel;
            const inner = Math.max(0, minR - band);
            const outer = maxR + band;
            if (dist < inner || dist > outer) continue;

            let mult = 1;
            if (e.type === "boss") mult = AURA_WAVE_BOSS_MULT;
            else if (e.elite) mult = AURA_WAVE_ELITE_MULT;

            const centerR = (minR + maxR) * 0.5;
            const waveBand = clamp(1 - Math.abs(dist - centerR) / Math.max(1, band), 0, 1);
            const smooth = Math.max(0.5, waveBand * waveBand * (3 - 2 * waveBand));
            const push = pushAway(e.x, e.y, waveX, waveY, force * mult * smooth);
            e.x += push.x * AURA_WAVE_POS_MULT;
            e.y += push.y * AURA_WAVE_POS_MULT;
            e.vx += push.x * AURA_WAVE_VEL_MULT;
            e.vy += push.y * AURA_WAVE_VEL_MULT;
            e._auraWaveHitT = state.t;
          }
        }
      }
    }

    function updateSameCircle(dt){
      if (hasUnique("same_circle")){
        state.sameCircleCd -= dt;
        if (state.sameCircleCd <= 0){
          clones.push({
            x: player.x,
            y: player.y,
            t: 0,
            life: SAME_CIRCLE_LIFE,
            shotTimer: 0,
            novaTimer: 0,
            orbitalAngle: randf(0, TAU),
            auraWaveT: 0,
            auraWaveActive: false,
            auraWaveR: 0,
            auraWaveMaxR: 0,
            auraWaveX: player.x,
            auraWaveY: player.y,
            auraWaveId: 0,
            auraTickT: 0,
          });
          state.sameCircleCd = SAME_CIRCLE_INTERVAL;
        }
      }
      for (let i=clones.length-1; i>=0; i--){
        const c = clones[i];
        c.t += dt;
        cloneShoot(c, dt);
        cloneShootNova(c, dt);
        updateCloneOrbitals(c, dt);
        applyCloneAura(c, dt);
        if (c.t >= c.life){
          explodeSameCircle(c);
          clones.splice(i,1);
        }
      }
    }

    function updateDashTrail(dt){
      for (let i=dashTrail.length-1; i>=0; i--){
        const d = dashTrail[i];
        d.t += dt;
        if (d.t >= d.life) dashTrail.splice(i,1);
      }
      if (state.dashT > 0){
        state.dashTrailT += dt;
        while (state.dashTrailT >= DASH_TRAIL_INTERVAL){
          state.dashTrailT -= DASH_TRAIL_INTERVAL;
          spawnDashTrail();
        }
      } else {
        state.dashTrailT = 0;
      }
    }

    function explodeSameCircle(c){
      const dmg = player.damage * SAME_CIRCLE_DAMAGE_MULT * getWoundedDamageMult();
      burst(c.x, c.y, randi(26, 38), 380, 0.75);
      burst(c.x, c.y, randi(10, 16), 220, 0.55);
      spawnShockwave(c.x, c.y, 12, SAME_CIRCLE_RADIUS * 0.9, 0.38, "rgba(200,235,255,0.95)");
      const force = getAuraWaveForce();
      for (let i=enemies.length-1; i>=0; i--){
        const e = enemies[i];
        if (!e || e.dead || e.dying) continue;
        const d = len2(e.x - c.x, e.y - c.y);
        if (d > SAME_CIRCLE_RADIUS + e.r) continue;
        e.hp -= dmg;
        e.hitFlash = Math.max(e.hitFlash, 0.12);
        recordDamage(dmg, e.x, e.y);
        if (force > 0){
          let mult = 1;
          if (e.type === "boss") mult = AURA_WAVE_BOSS_MULT;
          else if (e.elite) mult = AURA_WAVE_ELITE_MULT;
          const band = AURA_WAVE_THICKNESS + e.r;
          const waveBand = clamp(1 - (d / Math.max(1, SAME_CIRCLE_RADIUS + band)), 0, 1);
          const smooth = Math.max(0.5, waveBand * waveBand * (3 - 2 * waveBand));
          const push = pushAway(e.x, e.y, c.x, c.y, force * mult * smooth);
          e.x += push.x * AURA_WAVE_POS_MULT;
          e.y += push.y * AURA_WAVE_POS_MULT;
          e.vx += push.x * AURA_WAVE_VEL_MULT;
          e.vy += push.y * AURA_WAVE_VEL_MULT;
        }
        if (e.hp <= 0) killEnemy(e);
      }
    }
    function updateLightning(dt){
      for (let i=lightningStrikes.length-1; i>=0; i--){
        const s = lightningStrikes[i];
        s.t += dt;
        if (s.t >= s.life) lightningStrikes.splice(i,1);
      }
    }

    function enemyShoot(e, dt, tx, ty){
      if (!e.shotRate) return;

      const tier = e.bossTier || 0;
      const shootBullet = (x,y, ang, spd, dmg, r=4, life=3.2, extra=null) => {
        const b = {
          x,y,
          vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd,
          r, dmg, t:0, life,
          srcType: e.type,
          srcBossKind: e.bossKind || null,
        };
        if (extra) Object.assign(b, extra);
        enemyBullets.push(b);
      };
      const aim = Math.atan2(ty - e.y, tx - e.x);

      if (e.type === "blaster"){
        if ((e.blastKind || 0) === 1){
          e.burstCd = Math.max(0, (e.burstCd || 0) - dt);
          if ((e.holdT || 0) > 0){
            e.holdT = Math.max(0, (e.holdT || 0) - dt);
            if (e.holdT > 0) return;
            const n = randi(3, 5);
            const spread = 0.22;
            for (let i=0;i<n;i++){
              const t = n===1 ? 0 : (i/(n-1))*2-1;
              const ang = aim + t*spread;
              shootBullet(
                e.x, e.y, ang,
                e.shotSpeed, e.shotDmg,
                e.shotSize || 4,
                e.shotLife || 3.0,
                { color: e.bulletColor, glow: e.bulletGlow, explodeR: e.explodeR, explodePush: e.explodePush }
              );
            }
            e.burstCd = e.burstCooldown || 1.0;
            e.burstLeft = 0;
            e.burstTotal = 0;
            return;
          }
          if (e.burstCd > 0) return;
          e.holdT = randf(0.2, 0.4);
          return;
        }

        e.burstCd = Math.max(0, (e.burstCd || 0) - dt);
        e.shotTimer = Math.max(0, (e.shotTimer || 0) - dt);
        if ((e.burstLeft || 0) <= 0){
          if (e.burstCd > 0) return;
          const total = randi(3, 5);
          e.burstTotal = total;
          e.burstLeft = total;
        }
        if (e.shotTimer > 0) return;
        const spread = 0.10;
        const ang = aim + randf(-spread, spread);
        shootBullet(
          e.x, e.y, ang,
          e.shotSpeed, e.shotDmg,
          e.shotSize || 4,
          e.shotLife || 3.0,
          { color: e.bulletColor, glow: e.bulletGlow, explodeR: e.explodeR, explodePush: e.explodePush }
        );
        e.burstLeft -= 1;
        e.shotTimer = e.burstGap || 0.12;
        if (e.burstLeft <= 0) e.burstCd = e.burstCooldown || 1.0;
        return;
      }

      e.shotTimer -= dt;
      if (e.shotTimer > 0) return;

      if (e.type !== "boss") {
        // spitter shoots a small fan
        if (e.type === "spitter"){
          const fan = 3;
          const spread = 0.26;
          for (let i=0;i<fan;i++){
            const t = fan===1?0:(i/(fan-1))*2-1;
            shootBullet(e.x, e.y, aim + t*spread, e.shotSpeed, e.shotDmg, 4, 2.8);
          }
          e.shotTimer = 1 / e.shotRate;
          return;
        }

        shootBullet(e.x, e.y, aim, e.shotSpeed, e.shotDmg, 4, 2.8);
        e.shotTimer = 1 / e.shotRate;
        return;
      }

      const kind = e.bossKind || "beholder";

      if (kind === "beholder") {
        const fan = 5 + Math.min(6, tier);
        const spread = 0.50 + tier*0.03;
        for (let i=0;i<fan;i++){
          const t = fan===1?0:(i/(fan-1))*2-1;
          shootBullet(e.x, e.y, aim + t*spread, e.shotSpeed, e.shotDmg, 4, 3.4);
        }
        e.shotTimer = 1 / e.shotRate;
        return;
      }

      if (kind === "sniper") {
        const spd = e.shotSpeed * (1.15 + tier*0.03);
        const dmg = e.shotDmg   * (1.35 + tier*0.08);
        const trailExtra = {
          trail: "sniper",
          color: "rgba(120,220,255,0.95)",
          glow: "rgba(120,220,255,0.85)",
          trailColor: "rgba(120,220,255,0.6)",
        };
        shootBullet(e.x, e.y, aim, spd, dmg, 5, 3.6, trailExtra);
        if (tier >= 2) {
          shootBullet(e.x, e.y, aim + 0.22, spd*0.95, dmg*0.65, 4, 3.0, trailExtra);
          shootBullet(e.x, e.y, aim - 0.22, spd*0.95, dmg*0.65, 4, 3.0, trailExtra);
        }
        e.shotTimer = 1 / (e.shotRate * 0.9);
        return;
      }

      if (kind === "spiral") {
        e.bossPhase += (0.55 + tier*0.08);
        const bulletsN = 2 + Math.min(3, Math.floor(tier/2));
        for (let k=0;k<bulletsN;k++){
          const ang = e.bossPhase + k*(TAU/bulletsN);
          shootBullet(e.x, e.y, ang, e.shotSpeed*(0.95 + tier*0.03), e.shotDmg*(0.9 + tier*0.05), 4, 3.8);
        }
        e.shotTimer = 1 / (e.shotRate * 1.15);
        return;
      }

      if (kind === "charger") {
        const burstN = 3 + Math.min(4, tier);
        const spread = 0.22 + tier*0.02;
        for (let i=0;i<burstN;i++){
          const t = burstN===1?0:(i/(burstN-1))*2-1;
          shootBullet(e.x, e.y, aim + t*spread, e.shotSpeed*0.95, e.shotDmg*0.85, 4, 3.0);
        }
        e.shotTimer = 1 / (e.shotRate * 1.1);
        return;
      }

      if (kind === "summoner") {
        const fan = 3 + Math.min(2, Math.floor(tier/2));
        const spread = 0.35;
        for (let i=0;i<fan;i++){
          const t = fan===1?0:(i/(fan-1))*2-1;
          shootBullet(e.x, e.y, aim + t*spread, e.shotSpeed*0.9, e.shotDmg*0.8, 4, 3.2);
        }
        e.bossPhase += 1;
        e.shotTimer = 1 / (e.shotRate * 0.95);
        return;
      }

      
      if (kind === "mortar") {
        // slow big balls + small shrapnel at higher tier
        const balls = 2 + Math.min(2, Math.floor(tier/2));
        for (let i=0;i<balls;i++){
          const ang = aim + randf(-0.25, 0.25);
          shootBullet(e.x, e.y, ang, e.shotSpeed*0.75, e.shotDmg*1.35, 7, 4.0);
        }
        if (tier >= 3){
          const fan = 6;
          for (let i=0;i<fan;i++){
            const ang = (e.bossPhase||0) + i*(TAU/fan);
            shootBullet(e.x, e.y, ang, e.shotSpeed*0.95, e.shotDmg*0.45, 3, 2.8);
          }
          e.bossPhase = (e.bossPhase||0) + 0.35;
        }
        e.shotTimer = 1 / (e.shotRate * 0.85);
        return;
      }

      if (kind === "warden") {
        // ring around player direction
        const n = 10 + Math.min(10, tier*2);
        const base = (e.bossPhase||0);
        for (let i=0;i<n;i++){
          const ang = base + i*(TAU/n);
          shootBullet(e.x, e.y, ang, e.shotSpeed*(0.78 + tier*0.02), e.shotDmg*(0.62 + tier*0.03), 4, 3.8);
        }
        e.bossPhase = base + 0.18 + tier*0.015;
        e.shotTimer = 1 / (e.shotRate * 0.70);
        return;
      }

      if (kind === "vortex") {
        // alternating spiral towards the player
        const steps = 4 + Math.min(4, Math.floor(tier/2));
        const base = (e.bossPhase||0) + 0.9;
        for (let k=0;k<steps;k++){
          const ang = base + k*0.35;
          shootBullet(e.x, e.y, ang, e.shotSpeed*(0.9 + tier*0.02), e.shotDmg*(0.70 + tier*0.03), 4, 4.2);
          shootBullet(e.x, e.y, ang + Math.PI, e.shotSpeed*(0.75 + tier*0.02), e.shotDmg*(0.50 + tier*0.02), 3, 4.2);
        }
        e.bossPhase = base;
        e.shotTimer = 1 / (e.shotRate * 0.90);
        return;
      }

shootBullet(e.x, e.y, aim, e.shotSpeed, e.shotDmg, 4, 3.2);
      e.shotTimer = 1 / e.shotRate;
    }

    function triadShoot(e){
      const n = 3;
      const rad = e.triRad || 22;
      const spd = e.triShotSpeed || 260;
      const dmg = e.triShotDmg || 9;
      for (let k=0; k<n; k++){
        const ang = (e.triAngle || 0) + k*(TAU/n);
        const sx = e.x + Math.cos(ang) * rad;
        const sy = e.y + Math.sin(ang) * rad;
        enemyBullets.push({
          x: sx, y: sy,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          r: 4,
          dmg,
          t: 0,
          life: 3.0,
          srcType: e.type,
          srcBossKind: null,
        });
      }
    }

    // Bomber explode
    function explodeBomber(i){
      const e = enemies[i];
      if (!e || e.type !== "bomber") return;

      burst(e.x, e.y, randi(24, 34), 340, 0.50);

      // damage player
      const dxp = player.x - e.x, dyp = player.y - e.y;
      const dp = len2(dxp, dyp);
      if (dp < e.explodeR && player.invuln <= 0){
        const mult = 1 - (dp / e.explodeR); // 0..1
        const dmg = e.explodeDmg * (0.55 + 0.45 * mult) * player.damageTakenMult;
        player.hp -= dmg;
        const baseInvuln = getInvulnDuration(INVULN_CONTACT_BASE, INVULN_CONTACT_MIN);
        player.invuln = getInvulnAfterHit(baseInvuln);

        const push = pushAway(player.x, player.y, e.x, e.y, 18 + 22 * mult);
        player.x += push.x;
        player.y += push.y;
        player.vx += push.x * 22;
        player.vy += push.y * 22;

        if (player.hp <= 0){
          if (handlePlayerDeath("bomber explosion")) return;
        }
      }

      // damage turrets
      if (turrets.length){
        for (let t=turrets.length-1; t>=0; t--){
          const tur = turrets[t];
          if (circleRectHit(e.x, e.y, e.explodeR, tur.x, tur.y, tur.size, tur.size)){
            const dtur = len2(tur.x - e.x, tur.y - e.y);
            const mult = 1 - (dtur / e.explodeR);
            const dmg = e.explodeDmg * (0.55 + 0.45 * mult);
            tur.hp -= dmg;
            tur.hitCd = Math.max(tur.hitCd, 0.2);
            burst(tur.x,tur.y, randi(8,12), 220, 0.30);
            if (tur.hp <= 0) turrets.splice(t,1);
          }
        }
      }

      // damage other enemies
      for (let j = enemies.length - 1; j >= 0; j--){
        if (j === i) continue;
        const ee = enemies[j];
        if (!ee || ee.dead) continue;
        const d = len2(ee.x - e.x, ee.y - e.y);
        if (d < e.explodeR){
          const mult = 1 - (d / e.explodeR);
          const dmg = 22 * (0.5 + 0.5 * mult);
          ee.hp -= dmg;
          ee.hitFlash = Math.max(ee.hitFlash, 0.08);
          if (ee.hp <= 0) killEnemy(ee);
        }
      }

      killEnemy(e);
    }

    function killEnemy(e, immediate=false){
      if (!e || e.dead) return;
      if (e.type === "burst" && !immediate){
        if (!e.dying){
          e.dying = true;
          e.deathT = BURST_TELEGRAPH;
          e.hitFlash = Math.max(e.hitFlash, 0.12);
          e.vx = 0;
          e.vy = 0;
        }
        return;
      }
      e.dead = true;
      state.kills += 1;
      if (hasUnique("max_shirt") && state.maxShirtCd > 0){
        state.maxShirtCd = Math.max(0, state.maxShirtCd - MAX_SHIRT_KILL_CD_REDUCE);
      }
      burst(e.x,e.y, randi(10,16), 220, 0.35);
      dropXp(e.x,e.y, e.xp);

      if (player.lifeSteal > 0){
        let mult = 1;
        if (e.type === "boss") mult = 5;
        else if (e.elite) mult = 2;
        if (Math.random() < 0.02 * mult){
          const before = player.hp;
          player.hp = Math.min(player.hpMax, player.hp + player.hpMax * 0.01);
          const healed = player.hp - before;
          if (healed > 0) spawnHealFloat(healed);
        }
      }

      if (e.elite){
        const bonus = e.eliteReward ? Math.round(e.xp * 1.2) : Math.round(e.xp * 0.4);
        dropXp(e.x, e.y, bonus);
        if (e.eliteReward && Math.random() < 0.35){
          player.rerolls = Math.min(player.rerollCap, player.rerolls + 1);
        }
        if (Math.random() < 0.02){
          dropHeal(e.x, e.y, player.hpMax * randf(0.25, 0.50));
        }
      }

      if (e.type === "burst"){
        const n = Math.max(1, e.burstN || 6);
        const spd = e.burstSpeed || 260;
        const dmg = e.burstDmg || 9;
        const offset = randf(0, TAU);
        for (let k=0; k<n; k++){
          const ang = offset + k*(TAU/n);
          enemyBullets.push({
            x: e.x, y: e.y,
            vx: Math.cos(ang)*spd,
            vy: Math.sin(ang)*spd,
            r: 4,
            dmg,
            t: 0,
            life: 2.8,
            srcType: e.type,
            srcBossKind: null,
          });
        }
      }

      // splitter spawns minions
      if (e.type === "splitter"){
        const n = 2 + (Math.random() < 0.35 ? 1 : 0);
        for (let k=0;k<n;k++){
          const a = randf(0, TAU);
          const rr = randf(12, 24);
          spawnEnemy(false, "minion", {
            spawnX: e.x + Math.cos(a)*rr,
            spawnY: e.y + Math.sin(a)*rr,
            minion: true,
          });
        }
      }

      if (e.type==="boss"){
        spawn.bossActive = Math.max(0, spawn.bossActive - 1);
        if (spawn.bossActive <= 0) bossWrap.style.display = "none";
        player.hp = Math.min(player.hpMax, player.hp + 30);
        for(let i=0;i<8;i++) dropXp(e.x+randf(-20,20), e.y+randf(-20,20), 14);
        if (Math.random() < 0.10){
          dropHeal(e.x, e.y, player.hpMax * randf(0.25, 0.50));
        }
      }

    }

    function pruneDeadEnemies(){
      for (let i=enemies.length-1; i>=0; i--){
        if (enemies[i].dead) enemies.splice(i,1);
      }
    }

    // Upgrades (caps increased)
    const UPGRADES = createUpgrades({
      player,
      state,
      getLevel,
      getAuraWaveCooldown,
    });
    const upgradeList = Object.keys(UPGRADES);
    const atMax = (id)=>getLevel(id)>=UPGRADES[id].max;
    function addUniqueItem(id){
      const item = UNIQUES[id];
      if (!item || player.uniques.has(id)) return;
      player.uniques.add(id);
      player.uniquesOrder.push(id);
      if (item.apply) item.apply();
      if (pauseMenu.style.display === "grid") updateBuildUI();
    }
    function getNovaMagnetRadius(){
      const enabled = getLevel("novaMagnet") > 0;
      if (!enabled) return 0;
      const novaLv = getLevel("nova");
      const dmgLv = getLevel("novaDamage");
      return 82 + 2 * novaLv + dmgLv * 4;
    }
    function getAuraWaveForce(){
      const lv = getLevel("auraWave");
      if (lv <= 0) return 0;
      return AURA_WAVE_BASE_FORCE + (lv - 1) * AURA_WAVE_FORCE_STEP;
    }
    function getAuraWaveCooldown(lv = getLevel("auraWave")){
      if (lv <= 0) return AURA_WAVE_COOLDOWN_BASE;
      return Math.max(0.1, AURA_WAVE_COOLDOWN_BASE - (lv - 1) * AURA_WAVE_COOLDOWN_STEP);
    }

    function isEligible(id){
      if (atMax(id)) return false;
      if ((id === "auraRadius" || id === "auraDps" || id === "auraSlow" || id === "auraWave") && !player.aura) return false;
      if ((id === "orbitalDmg" || id === "orbitalRadius" || id === "orbitalSpeedUp") && player.orbitals <= 0) return false;
      if ((id === "novaDamage" || id === "novaRate" || id === "novaSpeed" || id === "novaMagnet") && player.novaCount <= 0) return false;
      if (id === "ricochetBounces" && player.ricochetChance <= 0) return false;
      if ((id === "turretLevel" || id === "turretHeal") && getTurretLevel() <= 0) return false;
      return true;
    }

    function rollRarity(source){
      let epic = source==="chest" ? 0.14 : 0.06;
      let rare = source==="chest" ? 0.30 : 0.20;
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
        const weaponish = (id==="fireRate"||id==="damage"||id==="pierce"||id==="multishot"||id==="crit"||id==="critMultUp"||id==="bulletSize"||id==="orbital"||id==="orbitalDmg"||id==="orbitalSpeedUp"||id==="aura"||id==="auraDps"||id==="auraSlow"||id==="auraWave"||id==="nova"||id==="novaDamage"||id==="novaRate"||id==="novaSpeed"||id==="novaMagnet"||id==="turret"||id==="turretLevel"||id==="turretHeal"||id==="ricochetChance"||id==="ricochetBounces"||id==="dog");
        const survival = (id==="hp"||id==="regen"||id==="speed"||id==="magnet"||id==="armor"||id==="dodge"||id==="lifesteal"||id==="xpGain"||id==="rerollCap"||id==="auraRadius"||id==="orbitalRadius"||id==="bulletSpeed");

        if (rarity === "rare"){
          w *= weaponish ? 2.2 : (survival ? 1.3 : 1.0);
        } else if (rarity === "epic"){
          w *= (id==="multishot"||id==="pierce"||id==="orbital"||id==="aura"||id==="damage"||id==="fireRate"||id==="critMultUp"||id==="lifesteal"||id==="nova"||id==="novaDamage"||id==="novaMagnet"||id==="turret"||id==="turretLevel"||id==="turretHeal"||id==="ricochetChance"||id==="ricochetBounces"||id==="dog") ? 3.0 : 1.1;
        } else {
          w *= (id==="speed"||id==="fireRate"||id==="damage"||id==="hp"||id==="magnet") ? 1.3 : 1.0;
        }
        const hpRatio = player.hpMax > 0 ? (player.hp / player.hpMax) : 1;
        const hasSustain = getLevel("regen") > 0 || getLevel("lifesteal") > 0;
        if (hpRatio < 0.20 && !hasSustain){
          if (id === "regen" || id === "lifesteal") w *= 2.8;
        }
        if (hpRatio < 0.10 && id === "hp") w *= 2.6;
        const lvl = getLevel(id);
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
      for (const [,w] of pool) sum += w;
      let r = Math.random() * sum;
      for (const [id,w] of pool){
        r -= w;
        if (r <= 0) return id;
      }
      return pool.length ? pool[pool.length-1][0] : null;
    }

    let currentChoices = [];
    let pickerSource = "level";

    function updateRerollsUI(){
      elRerolls.textContent = `Reroll ${player.rerolls}`;
    }

    function buildChoices(source){
      pickerSource = source;
      currentChoices = [];
      if (source === "unique"){
        buildUniqueChoices();
        return;
      }
      for (let slot=0; slot<3; slot++){
        const rarity = rollRarity(source);
        const pool = buildChoicePool(rarity).filter(([id]) => !currentChoices.some(c => c.id === id));
        if (!pool.length) break;
        const id = pickWeighted(pool);
        if (!id) break;
        currentChoices.push({ id, rarity });
      }
      while(currentChoices.length < 3){
        const pool = buildChoicePool("common").filter(([id]) => !currentChoices.some(c => c.id === id));
        if (!pool.length) break;
        const id = pickWeighted(pool);
        currentChoices.push({ id, rarity:"common" });
      }
    }

    function buildUniqueChoices(){
      const pool = uniquesList.filter((id)=>!player.uniquesSeen.has(id) && !player.uniques.has(id));
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
      for (let slot=0; slot<3; slot++){
        const rarity = pickRarity();
        if (!rarity) break;
        const list = rarityPools[rarity];
        const idx = randi(0, list.length - 1);
        const id = list.splice(idx, 1)[0];
        currentChoices.push({ id, rarity, kind:"unique" });
        if (rarity === "epic") epicAllowed = false;
      }
      for (const c of currentChoices) player.uniquesSeen.add(c.id);
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
      updateRerollsUI();
    }

    function maybeOpenLevelPicker(){
      if (state.pendingLevelUps <= 0) return;
      if (pickerOverlay.style.display === "grid") return;
      state.pendingLevelUps -= 1;
      openUpgradePicker("level");
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
      currentChoices.forEach((c, i)=>{
        const isUnique = c.kind === "unique";
        const entry = isUnique ? UNIQUES[c.id] : UPGRADES[c.id];
        const lv = isUnique ? 0 : getLevel(c.id);
        const desc = isUnique ? entry.desc : entry.desc(lv);
        const div = document.createElement("div");
        div.className = "choice";
        div.innerHTML = `
          <div class="t">
            ${i+1}. ${entry.title}
            <span class="pill ${c.rarity}">${c.rarity.toUpperCase()}</span>
          </div>
          <div class="d">${desc}</div>
        `;
        div.addEventListener("click", ()=>pickChoice(i));
        choicesWrap.appendChild(div);
      });
    }

    function pickChoice(i){
      if (pickerOverlay.style.display!=="grid") return;
      const c = currentChoices[i];
      if (!c) return;
      const id = c.id;
      if (c.kind === "unique"){
        addUniqueItem(id);
        pickerOverlay.style.display = "none";
        ui.buildFromPicker = false;
        btnResume.textContent = "Resume";
        state.paused = false;
        maybeOpenLevelPicker();
        return;
      }
      if (!isEligible(id)) return;

      UPGRADES[id].apply();
      player.upgrades[id] = getLevel(id) + 1;

      pickerOverlay.style.display = "none";
      ui.buildFromPicker = false;
      btnResume.textContent = "Resume";
      state.paused = false;
      maybeOpenLevelPicker();
    }

    function doReroll(){
      if (pickerOverlay.style.display!=="grid") return;
      if (pickerSource === "unique") return;
      if (player.rerolls <= 0) return;
      player.rerolls -= 1;
      buildChoices(pickerSource);
      renderChoices();
      btnReroll.disabled = player.rerolls <= 0;
      updateRerollsUI();
    }

    function doSkip(){
      if (pickerOverlay.style.display!=="grid") return;
      pickerOverlay.style.display = "none";
      ui.buildFromPicker = false;
      btnResume.textContent = "Resume";
      state.paused = false;
      maybeOpenLevelPicker();
    }

    btnReroll.addEventListener("click", doReroll);
    btnSkip.addEventListener("click", doSkip);

    btnShowBuild.addEventListener("click", ()=>{
      ui.buildFromPicker = (pickerOverlay.style.display === "grid");
      btnResume.textContent = ui.buildFromPicker ? "Back to picker" : "Resume";
      updateBuildUI();
      pauseMenu.style.display = "grid";
    });

    function setBuildTab(tab){
      ui.buildTab = tab;
      tabUpgrades.classList.toggle("active", tab === "upgrades");
      tabInventory.classList.toggle("active", tab === "inventory");
      buildListEl.style.display = tab === "upgrades" ? "flex" : "none";
      invListEl.style.display = tab === "inventory" ? "flex" : "none";
    }

    tabUpgrades.addEventListener("click", ()=>setBuildTab("upgrades"));
    tabInventory.addEventListener("click", ()=>setBuildTab("inventory"));

    function togglePauseMenu(){
      if (state.dead) return;
      if (restartConfirmOverlay.style.display === "grid") return;
      state.paused = !state.paused;
      if (state.paused){
        ui.buildFromPicker = false;
        btnResume.textContent = "Resume";
        updateBuildUI();
        pauseMenu.style.display = "grid";
      } else pauseMenu.style.display = "none";
    }

    btnResume.addEventListener("click", ()=>{
      if (ui.buildFromPicker && pickerOverlay.style.display === "grid"){
        pauseMenu.style.display = "none";
        return; // keep paused, picker remains
      }
      pauseMenu.style.display = "none";
      state.paused = false;
    });

    btnRestart2.addEventListener("click", ()=>resetGame());
    btnRestartYes.addEventListener("click", ()=>location.reload());
    btnRestartNo.addEventListener("click", hideRestartConfirm);
    btnCopy.addEventListener("click", ()=>copyStats());
    btnRecords.addEventListener("click", ()=>showRecords());
    btnHang.addEventListener("click", ()=>{
      if (!hasUnique("rope")) return;
      handlePlayerDeath("(он все таки смог)");
    });

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
          return `Нова: радиус магнита ${fmtNum(getNovaMagnetRadius())}`;
        case "turret":
          return `Турели: ${fmtPct(getTurretChance())} шанс · макс ${getTurretMax()} · агро ${fmtNum(getTurretAggroRadius())}`;
        case "turretLevel":
          return `Турели: урон ${fmtNum(getTurretDamage())} · скоростр. ${fmtNum(getTurretFireRate(), 2)}/с · HP ${fmtNum(getTurretHpMax())}`;
        case "turretHeal":
          return `Турели: притягивают XP (радиус ${fmtNum(getTurretAggroRadius())})`;
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
          return `Рикошет: отскоков ${getRicochetBounces()}`;
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
          return `Аура: волна ${fmtNum(getAuraWaveCooldown(), 1)}с · сила ${fmtNum(getAuraWaveForce())}`;
        case "speed":
          return `Скорость: ${fmtNum(getMoveSpeed())}`;
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
      btnHang.style.display = hasUnique("rope") ? "inline-flex" : "none";

      const wparts = [];
      wparts.push("Bullets");
      if (player.orbitals>0) wparts.push(`Orbit x${player.orbitals}`);
      if (player.aura) wparts.push("Aura");
      if (player.novaCount>0) wparts.push(`Nova x${player.novaCount * 3}`);
      if (getTurretLevel()>0) wparts.push(`Turret L${getTurretLevel()}`);

      buildStatsEl.innerHTML = `
        <div class="item"><div class="k">Hero</div><div class="v">${player.heroName}</div></div>
        <div class="small" style="opacity:.78; margin:6px 0 10px;">${player.heroPerkText}</div>
        <div class="item"><div class="k">Time</div><div class="v">${fmtTime(state.t)}</div></div>
        <div class="item"><div class="k">Level</div><div class="v">${player.lvl}</div></div>
        <div class="item"><div class="k">Kills</div><div class="v">${state.kills}</div></div>
        <div class="item"><div class="k">DPS (2s)</div><div class="v">${getDps()}</div></div>
        <div class="item"><div class="k">HP</div><div class="v">${Math.ceil(player.hp)} / ${player.hpMax}</div></div>
        <div class="item"><div class="k">Speed</div><div class="v">${Math.round(getMoveSpeed())}</div></div>
        <div class="item"><div class="k">Rerolls</div><div class="v">${player.rerolls}</div></div>
        <div class="item"><div class="k">Weapons</div><div class="v">${wparts.join(" + ")}</div></div>
      `;
    }

    let recordsReturnToPause = false;
    let recordsReturnToMenu = false;
    let settingsReturnToPause = false;
    let settingsReturnToMenu = false;
    let restartReturnToPause = false;
    let restartReturnToPlay = false;

    function renderRecords(){
      const records = loadRecords();
      const levelText = records.level > 0 ? records.level : "--";
      const timeText = records.time > 0 ? fmtTime(records.time) : "--";
      const killsText = records.kills > 0 ? records.kills : "--";
      const dpsText = records.dps > 0 ? records.dps : "--";
      recordsListEl.innerHTML = `
        <div class="item"><div class="k">Макс. уровень</div><div class="v">${levelText}</div></div>
        <div class="item"><div class="k">Макс. время</div><div class="v">${timeText}</div></div>
        <div class="item"><div class="k">Макс. убийств</div><div class="v">${killsText}</div></div>
        <div class="item"><div class="k">Макс. DPS (2s)</div><div class="v">${dpsText}</div></div>
      `;
    }
    function showRecords(){
      recordsReturnToPause = pauseMenu.style.display === "grid";
      recordsReturnToMenu = mainMenuOverlay.style.display === "grid";
      if (recordsReturnToPause) pauseMenu.style.display = "none";
      if (recordsReturnToMenu) mainMenuOverlay.style.display = "none";
      renderRecords();
      recordsOverlay.style.display = "grid";
      updatePauseBtnVisibility();
    }
    function hideRecords(){
      recordsOverlay.style.display = "none";
      if (recordsReturnToPause){
        pauseMenu.style.display = "grid";
      } else if (recordsReturnToMenu){
        mainMenuOverlay.style.display = "grid";
      }
      recordsReturnToPause = false;
      recordsReturnToMenu = false;
      updatePauseBtnVisibility();
    }
    function showSettings(){
      settingsReturnToPause = pauseMenu.style.display === "grid";
      settingsReturnToMenu = mainMenuOverlay.style.display === "grid";
      if (settingsReturnToPause) pauseMenu.style.display = "none";
      if (settingsReturnToMenu) mainMenuOverlay.style.display = "none";
      applyOptionsToUI();
      settingsOverlay.style.display = "grid";
      updatePauseBtnVisibility();
    }
    function hideSettings(){
      settingsOverlay.style.display = "none";
      if (settingsReturnToPause){
        pauseMenu.style.display = "grid";
      } else if (settingsReturnToMenu){
        mainMenuOverlay.style.display = "grid";
      }
      settingsReturnToPause = false;
      settingsReturnToMenu = false;
      updatePauseBtnVisibility();
    }

    function showRestartConfirm(){
      if (restartConfirmOverlay.style.display === "grid") return;
      restartReturnToPause = pauseMenu.style.display === "grid";
      restartReturnToPlay = !state.paused;
      if (restartReturnToPause) pauseMenu.style.display = "none";
      state.paused = true;
      restartConfirmOverlay.style.display = "grid";
      updatePauseBtnVisibility();
    }

    function hideRestartConfirm(){
      restartConfirmOverlay.style.display = "none";
      if (restartReturnToPause){
        pauseMenu.style.display = "grid";
      } else if (restartReturnToPlay){
        state.paused = false;
      }
      restartReturnToPause = false;
      restartReturnToPlay = false;
      updatePauseBtnVisibility();
    }

    function gameOver(){
      state.dead = true;
      state.paused = true;
      pickerOverlay.style.display = "none";
      pauseMenu.style.display = "none";
      gameoverOverlay.style.display = "grid";
      updateRecordsOnDeath({ state, player });
      summaryEl.textContent = `Time: ${fmtTime(state.t)} · Hero: ${player.heroName} · Level: ${player.lvl} · Kills: ${state.kills} · Damage: ${Math.round(state.dmgDone)}${state.deathReason ? ` · Cause: ${state.deathReason}` : ""}`;
      updatePauseBtnVisibility();
    }

    function copyStats(){
      const text =
`Survivor stats
Hero: ${player.heroName}
Time: ${fmtTime(state.t)}
Level: ${player.lvl}
Kills: ${state.kills}
Damage: ${Math.round(state.dmgDone)}
Rerolls: ${player.rerolls}
Upgrades: ${Object.keys(player.upgrades).map(k=>`${k}:${player.upgrades[k]}`).join(", ")}
`;
      navigator.clipboard?.writeText(text).catch(()=>{});
    }

    restartBtn.addEventListener("click", ()=>resetGame());
    copyBtn.addEventListener("click", ()=>copyStats());
    btnRecordsOver.addEventListener("click", ()=>showRecords());
    btnRecordsClose.addEventListener("click", ()=>hideRecords());

    function resetGame(){
      if (!state.dead){
        showRestartConfirm();
        return;
      }
      location.reload();
    }

    // Loop
    const step = createStep({
      state,
      player,
      elFps,
      update,
      render,
      hasUnique,
    });

    function update(dt){
      state.t += dt;

      const dampFast = Math.pow(0.001, dt);
      const dampSlow = Math.pow(0.02, dt);
      const lerpFast = 1 - dampFast;

      updateSpawning({
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
      });

      const moveSpeed = getMoveSpeed();
      updateMovement({
        dt,
        keys,
        isTouch,
        joyVec,
        player,
        state,
        turrets,
        lerpFast,
        moveSpeed,
      });
      const spd = len2(player.vx, player.vy) || 0;
      const ratio = clamp(spd / Math.max(1, moveSpeed), 0, 1);
      const baseSpd = getBaseMoveSpeed();
      const speedBonus = moveSpeed / baseSpd;
      const targetScale = GAME_SCALE * (1 - CAMERA_ZOOM_OUT * speedBonus * ratio);
      cameraScale = lerp(cameraScale, targetScale, lerpFast);

      // regen + invuln
      if (player.regen > 0 && player.hp > 0){
        player.hp = Math.min(player.hpMax, player.hp + player.regen*dt);
      }
      updateHeal(dt);
      player.invuln = Math.max(0, player.invuln - dt);

      // totem zone effect
      if (totem.active){
        totem.t += dt;
        totem.life = Math.max(0, totem.life - dt);
        totem.grace = Math.max(0, totem.grace - dt);

        const dxT = player.x - totem.x;
        const dyT = player.y - totem.y;
        const inZone = (dxT*dxT + dyT*dyT) <= totem.r*totem.r;
        totem.inZone = inZone;

        if (totem.grace <= 0 && !inZone){
          totem.effect = Math.min(TOTEM_EFFECT_MAX, totem.effect + dt * getTotemEffectGain());
          const dps = TOTEM_DPS_BASE + getTotemDpsRamp() * totem.effect;
          const dmg = applyDamageToPlayer(dps * dt);
          if (dmg > 0 && player.hp <= 0){
            if (handlePlayerDeath("totem")) return;
          }
        } else if (inZone){
          totem.effect = Math.max(0, totem.effect - dt * TOTEM_EFFECT_DECAY);
          if (hasUnique("peace_pipe") && player.hp > 0){
            const regenLv = getLevel("regen");
            const bonus = 1 + Math.round(0.5 * regenLv);
            player.hp = Math.min(player.hpMax, player.hp + bonus * dt);
          }
        }

        if (totem.life <= 0){
          totem.active = false;
          totem.life = 0;
          totem.grace = 0;
          totem.inZone = false;
        }
      } else if (totem.effect > 0){
        totem.effect = Math.max(0, totem.effect - dt * TOTEM_EFFECT_DECAY * 0.7);
      }

      // chest pickup
      if (chests.length){
        const c = chests[0];
        c.t += dt;
        if (circleHit(player.x,player.y,player.r, c.x,c.y,c.r)){
          pickUpChest();
        }
      }

      gridBuild();
      updateTurrets(dt);
      shoot(dt);
      shootNova(dt);
      updateOrbitals(dt);
      applyAura(dt);
      updateDogs(dt);
      updateSameCircle(dt);
      updateDashTrail(dt);
      updateLightning(dt);
      if (hasUnique("patriarch_doll") && state.patriarchDollCd <= 0){
        const didHit = tryActivatePatriarchDoll();
        if (!didHit){
          state.patriarchDollCd = PATRIARCH_DOLL_COOLDOWN;
        }
      }

      // bullets
      const candidates = [];
      for (let i=bullets.length-1;i>=0;i--){
        const b=bullets[i];
        b.t += dt;
        b.x += b.vx*dt;
        b.y += b.vy*dt;
        if (b.t >= b.life){ bullets.splice(i,1); continue; }

        gridQueryCircle(b.x, b.y, b.r + ENEMY_MAX_R, candidates);
        for (let j=candidates.length-1;j>=0;j--){
          const e=candidates[j];
          if (e.dead || e.dying) continue;
          if (b.lastHitId && e.id === b.lastHitId) continue;
          if (b.hitIds && b.hitIds.has(e.id)) continue;
          if (!circleHit(b.x,b.y,b.r, e.x,e.y,e.r)) continue;

          const isCrit = Math.random() < player.critChance;
          let dmg = b.dmg * (isCrit ? player.critMult : 1);
          // shield enemy takes reduced bullet damage
          if (e.type === "shield") dmg *= 0.65;
          e.hp -= dmg;
          e.hitFlash = 0.09;
          const dmgSize = (e.type === "boss") ? 32 : null;
          recordDamage(dmg, e.x, e.y, isCrit, "rgba(255,190,90,0.95)", dmgSize);
          if (!b.hitIds) b.hitIds = new Set();
          b.hitIds.add(e.id);

          let didRicochet = false;
          let removedOnRicochet = false;
          if ((b.ricochetLeft || 0) > 0 && (b.ricochetChance || 0) > 0 && Math.random() < b.ricochetChance){
            const target = findRicochetTarget(e.x, e.y, e.id, b.lastHitId);
            if (target){
              const dx = target.x - e.x;
              const dy = target.y - e.y;
              const d = len2(dx,dy) || 1;
              const spd = len2(b.vx, b.vy) || player.bulletSpeed;
              const baseAng = Math.atan2(dy, dx);

              if (hasUnique("cheap_bullets")){
                spawnCheapRicochetSplits(b, e, target, spd, baseAng);
                bullets.splice(i,1);
                removedOnRicochet = true;
                didRicochet = true;
              } else {
                b.vx = (dx/d) * spd;
                b.vy = (dy/d) * spd;
                b.x = e.x + (dx/d) * (e.r + b.r + 2);
                b.y = e.y + (dy/d) * (e.r + b.r + 2);
                b.ricochetLeft -= 1;
                b.lastHitId = e.id;
                didRicochet = true;
              }
            }
          }

          if (!b.isNova && !removedOnRicochet){
            if (!didRicochet) b.pierce -= 1;
            if (b.pierce<=0 && !didRicochet){
              bullets.splice(i,1);
            } else if (!didRicochet) {
              const minDmg = (b.baseDmg || b.dmg) * PIERCE_DAMAGE_MIN_RATIO;
              b.dmg = Math.max(b.dmg * PIERCE_DAMAGE_FALLOFF, minDmg);
            }
          }

          if (e.hp<=0) killEnemy(e);
          break;
        }
      }

      // enemy bullets
      for (let i=enemyBullets.length-1;i>=0;i--){
        const b=enemyBullets[i];
        b.t += dt;
        b.x += b.vx*dt;
        b.y += b.vy*dt;
        if (b.t >= b.life){ enemyBullets.splice(i,1); continue; }

        if (turrets.length){
          let hitTurret = false;
          for (let t=turrets.length-1; t>=0; t--){
            const tur = turrets[t];
            if (circleRectHit(b.x,b.y,b.r, tur.x,tur.y, tur.size, tur.size)){
              tur.hp -= b.dmg;
              tur.hitCd = Math.max(tur.hitCd, 0.1);
              if (b.explodeR) burst(b.x,b.y, randi(10,16), 260, 0.32);
              else burst(tur.x,tur.y, randi(6,10), 200, 0.25);
              enemyBullets.splice(i,1);
              if (tur.hp <= 0) turrets.splice(t,1);
              hitTurret = true;
              break;
            }
          }
          if (hitTurret) continue;
        }

        if (circleHit(b.x,b.y,b.r, player.x,player.y, player.r)){
          if (player.invuln<=0){
            applyDamageToPlayer(b.dmg);
            const baseInvuln = getInvulnDuration(INVULN_BULLET_BASE, INVULN_BULLET_MIN);
            player.invuln = getInvulnAfterHit(baseInvuln);
            if (b.explodeR){
              const push = pushAway(player.x, player.y, b.x, b.y, b.explodePush || 16);
              player.x += push.x;
              player.y += push.y;
              player.vx += push.x * 18;
              player.vy += push.y * 18;
              burst(b.x,b.y, randi(12,18), 280, 0.36);
            } else {
              burst(player.x,player.y, randi(10,16), 240, 0.32);
            }
            enemyBullets.splice(i,1);
            if (player.hp<=0){
              const label = enemyLabel(b.srcType, b.srcBossKind);
              if (handlePlayerDeath(`bullet ${label}`)) return;
            }
          } else enemyBullets.splice(i,1);
        }
      }

      pruneDeadEnemies();

      // enemies
      let xpNearNormal = 0;
      let xpNearElite = 0;
      let xpNearBoss = 0;
      for (let i=enemies.length-1;i>=0;i--){
        const e=enemies[i];
        if (e.dead) continue;
        if (e.dying){
          e.deathT = Math.max(0, e.deathT - dt);
          if (e.deathT <= 0) killEnemy(e, true);
          continue;
        }
        e.hitFlash = Math.max(0, e.hitFlash - dt);
        e.auraFlash = Math.max(0, (e.auraFlash || 0) - dt);

        if (e.type === "boss" && e.bossKind === "colossus" && e.hp > 0){
          const hpPct = e.hpMax > 0 ? (e.hp / e.hpMax) : 0;
          const stage = Math.min(
            COLOSSUS_SPAWN_STAGES,
            Math.floor((1 - clamp(hpPct, 0, 1)) / COLOSSUS_HP_STEP)
          );
          const prevStage = e.bossShrinkStage || 0;
          if (stage > prevStage){
            for (let s = prevStage; s < stage; s++){
              spawnColossusElite(e);
            }
            e.bossShrinkStage = stage;
            const baseR = e.bossBaseR || e.r;
            e.r = Math.max(10, baseR * (1 - COLOSSUS_SHRINK_STEP * stage));
          }
        }

        if (e.type === "triad"){
          e.triAngle = (e.triAngle || 0) + (e.triDir || 1) * (e.triSpin || 0) * dt;
          e.triShotTimer = (e.triShotTimer || 0) - dt;
          if (e.triShotTimer <= 0){
            triadShoot(e);
            e.triShotTimer = 1 / (e.triShotRate || 0.8);
          }
        }

        const target = getEnemyTarget(e);
        const dx = target.x - e.x, dy = target.y - e.y;
        const d = len2(dx,dy) || 1;
        e.moveDirX = dx / d;
        e.moveDirY = dy / d;

        // bomber explode when close
        if (e.type === "bomber"){
          const dist = len2(dx, dy);
          if (dist < e.explodeR * 0.55){
            explodeBomber(i);
            continue;
          }
        }

        e.vx *= dampFast;
        e.vy *= dampFast;


        // Dasher (обычный моб) — короткие рывки к игроку
        if (e.type === "dasher"){
          e.bossDashCd = Math.max(0, (e.bossDashCd || 0) - dt);
          e.bossDashT  = Math.max(0, (e.bossDashT  || 0) - dt);

          if (e.bossDashT > 0){
            e.x += (e.bossDashVx || 0) * dt;
            e.y += (e.bossDashVy || 0) * dt;
          } else if ((e.bossDashCd || 0) <= 0){
            const a = Math.atan2(target.y - e.y, target.x - e.x);
            const spd = 560 + Math.min(220, state.difficulty*22);
            e.bossDashVx = Math.cos(a) * spd;
            e.bossDashVy = Math.sin(a) * spd;
            e.bossDashT  = 0.18;
            e.bossDashCd = 1.35;
          }
        }

        // Charger dash
        if (e.type === "boss" && e.bossKind === "charger") {
          e.bossDashCd = Math.max(0, (e.bossDashCd || 0) - dt);
          e.bossDashT  = Math.max(0, (e.bossDashT  || 0) - dt);

          if (e.bossDashT > 0) {
            e.x += e.bossDashVx * dt;
            e.y += e.bossDashVy * dt;
          } else if (e.bossDashCd <= 0) {
            const tier = e.bossTier || 0;
            const a = Math.atan2(player.y - e.y, player.x - e.x);
            const spd = 520 + tier*40;
            e.bossDashVx = Math.cos(a) * spd;
            e.bossDashVy = Math.sin(a) * spd;
            e.bossDashT  = 0.28 + tier*0.01;
            e.bossDashCd = 1.6 - Math.min(0.8, tier*0.08);
          }
        }

        const isDashing = ((e.type==="boss" && e.bossKind==="charger") || e.type==="dasher") && (e.bossDashT||0) > 0;
        const isBlasterHold = e.type==="blaster" && (e.blastKind || 0) === 1 && (e.holdT||0) > 0;
        if (!isDashing) {
          e._slowT = Math.max(0, (e._slowT||0) - dt);
          const spdNow = e.spd * ((e._slowT||0) > 0 ? (e._slowMult||1) : 1);
          if (isBlasterHold){
            e.x += e.vx * dt;
            e.y += e.vy * dt;
          } else {
            e.x += ((dx/d)*spdNow + e.vx) * dt;
            e.y += ((dy/d)*spdNow + e.vy) * dt;
          }
        }

        if (e.type==="shooter" || e.type==="spitter" || e.type==="blaster" || e.type==="boss") enemyShoot(e, dt, target.x, target.y);

        // anti-sticky player collision + damage
        if (circleHit(player.x,player.y, player.r, e.x,e.y, e.r)){
          const overlap = (player.r + e.r) - len2(player.x - e.x, player.y - e.y);
          let push = pushAway(player.x, player.y, e.x, e.y, Math.max(6, overlap * 0.6));
          if (e.type === "triad"){
            const dxp = player.x - e.x;
            const dyp = player.y - e.y;
            const dist = len2(dxp, dyp) || 1;
            const nx = dxp / dist;
            const ny = dyp / dist;
            const base = Math.max(6, overlap * 0.6);
            const pushStrength = base * 1.6;
            const tangStrength = base * 0.8;
            const tx = -ny * (e.triDir || 1);
            const ty =  nx * (e.triDir || 1);
            push = {
              x: nx * pushStrength + tx * tangStrength,
              y: ny * pushStrength + ty * tangStrength,
            };
          }
          if (state.dashT > 0){
            e.x -= push.x * 0.35;
            e.y -= push.y * 0.35;
            e.vx -= push.x * 6;
            e.vy -= push.y * 6;
          } else {
            player.x += push.x;
            player.y += push.y;
            player.vx += push.x * 18;
            player.vy += push.y * 18;
          }

          if (player.invuln<=0){
            applyDamageToPlayer(e.dmg);
            const baseInvuln = getInvulnDuration(INVULN_CONTACT_BASE, INVULN_CONTACT_MIN);
            player.invuln = getInvulnAfterHit(baseInvuln);
            burst(player.x,player.y, randi(12,20), 260, 0.35);
            if (player.hp<=0){
              if (handlePlayerDeath(`contact ${enemyLabel(e.type, e.bossKind)}`)) return;
            }
          }
        }
        if (turrets.length){
          for (let t=turrets.length-1; t>=0; t--){
            const tur = turrets[t];
            if (circleRectHit(e.x,e.y, e.r, tur.x,tur.y, tur.size, tur.size)){
              if (tur.hitCd <= 0){
                tur.hp -= e.dmg;
                tur.hitCd = 0.25;
                burst(tur.x,tur.y, randi(6,10), 200, 0.25);
                if (tur.hp <= 0) turrets.splice(t,1);
              }
              const push = pushAway(e.x, e.y, tur.x, tur.y, 6);
              e.x += push.x;
              e.y += push.y;
              e.vx += push.x * 14;
              e.vy += push.y * 14;
            }
          }
        }
        const dxp = e.x - player.x;
        const dyp = e.y - player.y;
        if ((dxp*dxp + dyp*dyp) <= player.magnet * player.magnet){
          if (e.type === "boss") xpNearBoss += 1;
          else if (e.elite) xpNearElite += 1;
          else xpNearNormal += 1;
        }
      }

      pruneDeadEnemies();
      state.xpEnemyBonus = xpNearNormal * XP_BONUS_NORMAL
        + xpNearElite * XP_BONUS_ELITE
        + xpNearBoss * XP_BONUS_BOSS;

      // XP drops update + pickup
      const novaMagnetR = getNovaMagnetRadius();
      const novaBullets = (novaMagnetR > 0) ? bullets.filter(b => b.isNova) : [];
      const turretPull = hasTurretHeal() && turrets.length > 0;
      const turretAggro = turretPull ? getTurretAggroRadius() : 0;
      for (let i = drops.length - 1; i >= 0; i--) {
        const g = drops[i];
        g.t += dt;

        // initial drift fades
        g.vx *= dampFast;
        g.vy *= dampFast;
        g.x += g.vx * dt;
        g.y += g.vy * dt;

        let dx = player.x - g.x;
        let dy = player.y - g.y;
        let dist = len2(dx, dy) || 1;

        let targetX = player.x;
        let targetY = player.y;
        let targetMagnet = player.magnet;
        let useNova = false;
        let useTurret = false;
        if (novaBullets.length){
          for (const b of novaBullets){
            const ndx = b.x - g.x;
            const ndy = b.y - g.y;
            if ((ndx*ndx + ndy*ndy) <= novaMagnetR * novaMagnetR){
              g.novaPull = true;
              break;
            }
          }
        }
        if (g.novaPull) useNova = true;
        if (turretPull && g.kind === "xp"){
          if (!g.turretPull){
            for (const t of turrets){
              const tdx = t.x - g.x;
              const tdy = t.y - g.y;
              if ((tdx*tdx + tdy*tdy) <= turretAggro * turretAggro){
                g.turretPull = true;
                break;
              }
            }
          }
          if (g.turretPull) useTurret = true;
        }
        if (useNova) targetMagnet = Math.max(targetMagnet, dist + 1);
        if (useTurret) targetMagnet = Math.max(targetMagnet, turretAggro * 4);

        if (dist < targetMagnet) {
          const pull = (1 - dist / targetMagnet);
          const boost = (useNova || useTurret);
          const speed = (boost ? 340 : 240) + (boost ? 680 : 520) * pull;
          g.x += (dx / dist) * speed * dt;
          g.y += (dy / dist) * speed * dt;
        }

        if (dist < player.r + g.r + 6) {
          if (g.kind === "heal") queueHeal(g.v);
          else gainXp(g.v);
          drops.splice(i, 1);
        } else if (g.t > (g.life || 36)) {
          drops.splice(i, 1);
        }
      }

      // particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.t += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= dampSlow;
        p.vy *= dampSlow;
        if (p.t >= p.life) particles.splice(i, 1);
      }

      // shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const s = shockwaves[i];
        s.t += dt;
        if (s.t >= s.life) shockwaves.splice(i, 1);
      }

      // heal floaters
      for (let i = floaters.length - 1; i >= 0; i--) {
        const f = floaters[i];
        f.t += dt;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vx *= dampSlow;
        f.vy *= dampSlow;
        if (f.t >= f.life) floaters.splice(i, 1);
      }

      // boss ui
      const bosses = [];
      for (const ee of enemies){
        if (ee.type === "boss" && !ee.dead) bosses.push(ee);
      }
      if (bosses.length){
        bossWrap.style.display = "block";
        let html = "";
        for (const b of bosses){
          const name = BOSS_NAME[b.bossKind] || "Boss";
          const tier = (b.bossTier || 0) + 1;
          const hpPct = clamp(b.hp / b.hpMax, 0, 1);
          html += `<div class="bossRow"><div class="bossName">BOSS: ${name} (T${tier})</div><div class="bar bossHp"><div class="fill" style="width:${(hpPct*100).toFixed(2)}%"></div></div></div>`;
        }
        bossList.innerHTML = html;
      } else {
        bossWrap.style.display = "none";
        bossList.innerHTML = "";
      }

      // HUD
      elLvl.textContent = `Lv ${player.lvl}`;
      elKills.textContent = `Kills ${state.kills}`;
      if (elEnemiesCount){
        let alive = 0;
        for (const e of enemies) if (!e.dead) alive += 1;
        elEnemiesCount.textContent = `Enemies ${alive}`;
      }
      if (elShots) elShots.textContent = `Bullets ${bullets.length + enemyBullets.length}`;
      const dpsNow = getDps();
      elDps.textContent = `Dmg ${dpsNow}`;
      if (dpsNow > state.maxDps) state.maxDps = dpsNow;
      elTime.textContent = fmtTime(state.t);
      if (totemTimerEl){
        if (totem.active && totem.grace > 0){
          totemTimerEl.style.display = "block";
          totemTimerEl.innerHTML = `${Math.max(0, Math.ceil(totem.grace))}<span class="sub">Идите в зону тотема</span>`;
        } else {
          totemTimerEl.style.display = "none";
        }
      }
      if (totemWarningEl){
        const showWarning = totem.active && totem.grace <= 0 && !totem.inZone;
        totemWarningEl.classList.toggle("show", showWarning);
      }

      const hpPct = clamp(player.hp / player.hpMax, 0, 1);
      hpbar.style.width = `${hpPct*100}%`;
      if (hpbarPulse){
        const healing = !!state.healActive || state.healQueue.length > 0;
        hpbarPulse.style.display = healing ? "block" : "none";
        if (healing) hpbarPulse.style.width = `${hpPct*100}%`;
      }
      hptext.textContent = `${Math.ceil(player.hp)} / ${player.hpMax}`;

      xpbar.style.width = `${(player.xp/player.xpNeed)*100}%`;
      xptext.textContent = `${Math.floor(player.xp)} / ${player.xpNeed}`;

      if (totemBar && totemText){
        const totemLeft = totem.active ? totem.life : state.totemTimer;
        const totemMax = totem.active ? (totem.lifeMax || getTotemLife()) : (state.totemTimerMax || getTotemInterval());
        const totemPct = clamp(totemLeft / Math.max(1, totemMax), 0, 1);
        totemBar.style.width = `${totemPct*100}%`;
        totemText.textContent = `${Math.max(0, Math.ceil(totemLeft))}s`;
      }
      if (bossBar && bossText){
        const bossLeft = Math.max(0, spawn.nextBossAt - state.t);
        const bossMax = Math.max(1, spawn.bossEvery || 1);
        const bossPct = clamp(bossLeft / bossMax, 0, 1);
        bossBar.style.width = `${bossPct*100}%`;
        bossText.textContent = `${Math.max(0, Math.ceil(bossLeft))}s`;
      }
      if (chestBar && chestText){
        if (state.chestAlive){
          chestBar.style.width = "100%";
          chestText.textContent = chests.length ? "ON MAP" : "SPAWNING…";
        } else {
          const chestLeft = Math.max(0, state.chestTimer);
          const chestMax = Math.max(1, getChestInterval());
          const chestPct = clamp(chestLeft / chestMax, 0, 1);
          chestBar.style.width = `${chestPct*100}%`;
          chestText.textContent = `${Math.max(0, Math.ceil(chestLeft))}s`;
        }
      }
      if (actionBar && actionBarFill){
        if (hasUnique("max_shirt")){
          actionBar.style.display = "block";
          const pct = clamp(1 - (state.maxShirtCd / MAX_SHIRT_COOLDOWN), 0, 1);
          actionBarFill.style.height = `${pct*100}%`;
        } else {
          actionBar.style.display = "none";
        }
      }

      elWep.textContent = "W: Bullets"
        + (player.orbitals>0?` + Orbit x${player.orbitals}`:"")
        + (player.aura?" + Aura":"")
        + (player.novaCount>0?` + Nova x${player.novaCount * 3}`:"")
        + (getTurretLevel()>0?` + Turret L${getTurretLevel()}`:"");

      if (elChestRespawn) elChestRespawn.textContent = String(getChestInterval());

      elRerolls.textContent = `Reroll ${player.rerolls}`;
      if (elThreat) elThreat.textContent = `Threat ${state.difficulty.toFixed(1)}`;
      if (elActionHint){
        const hasActionSkill = hasAnyActionSkill();
        if (hasActionSkill){
          elActionHint.style.display = "";
          elActionHint.textContent = isTouch ? "Кнопка действия: двойной тап" : "Кнопка действия: Space";
        } else {
          elActionHint.style.display = "none";
          elActionHint.textContent = "";
        }
      }
      if (activeItemsEl && activeItemsListEl){
        const items = [];
        for (const id of player.uniquesOrder){
          if (!player.uniques.has(id)) continue;
          const u = UNIQUES[id];
          if (u && u.action) items.push(u.title);
        }
        if (!items.length){
          activeItemsEl.style.display = "none";
          activeItemsListEl.innerHTML = "";
        } else {
          activeItemsEl.style.display = "block";
          activeItemsListEl.innerHTML = items.map((t)=>`<div class="item">${t}</div>`).join("");
        }
      }
    }

    function render(){
      ctx.setTransform(getDpr() * cameraScale, 0, 0, getDpr() * cameraScale, 0, 0);
      const w = innerWidth  / cameraScale;
      const h = innerHeight / cameraScale;

      const camX = player.x - w*0.5;
      const camY = player.y - h*0.5;

      ctx.fillStyle = "#0b0e14";
      ctx.fillRect(0,0,w,h);

      batch.bullets.length = 0;
      batch.orbitals.length = 0;
      batch.orbitalsClone.length = 0;
      batchMapClear(batch.enemyBullets);

      // grid
      const g = 52;
      const gx0 = Math.floor(camX/g)*g;
      const gy0 = Math.floor(camY/g)*g;

      ctx.globalAlpha = 0.40;
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x=gx0; x<camX+w+g; x+=g){
        const sx = x-camX;
        ctx.moveTo(sx,0); ctx.lineTo(sx,h);
      }
      for (let y=gy0; y<camY+h+g; y+=g){
        const sy = y-camY;
        ctx.moveTo(0,sy); ctx.lineTo(w,sy);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // totem
      if (totem.active){
        const sx=totem.x-camX, sy=totem.y-camY;
        const pulse = 0.5 + 0.5 * Math.sin(totem.t * 2.6);
        const inner = totem.r * (0.15 + 0.55 * pulse);
        const grad = ctx.createRadialGradient(sx, sy, inner, sx, sy, totem.r);
        grad.addColorStop(0, "rgba(90,220,190,0)");
        grad.addColorStop(0.55, `rgba(90,220,190,${0.05 + 0.06 * pulse})`);
        grad.addColorStop(1, `rgba(90,220,190,${0.12 + 0.12 * pulse})`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, totem.r, 0, TAU);
        ctx.fill();

        const lifeLeft = Math.max(0, Math.ceil(totem.life));
        const fontSize = Math.max(32, totem.r * 0.75);
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "rgba(120,240,200,0.38)";
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = Math.max(2, fontSize * 0.03);
        ctx.font = `900 ${fontSize}px system-ui,-apple-system,Segoe UI,Roboto,Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeText(String(lifeLeft), sx, sy);
        ctx.fillText(String(lifeLeft), sx, sy);
        ctx.restore();

        ctx.globalAlpha = 0.55 + 0.12 * pulse;
        ctx.strokeStyle = "rgba(90,220,190,0.55)";
        ctx.lineWidth = 2 + 2 * pulse;
        ctx.beginPath();
        ctx.arc(sx, sy, totem.r, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.save();
        ctx.shadowColor = "rgba(90,220,190,0.55)";
        ctx.shadowBlur = 18 + 8 * pulse;
        ctx.fillStyle = "rgba(80,200,170,0.78)";
        ctx.beginPath();
        ctx.roundRect(sx-10, sy-18, 20, 36, 6);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillRect(sx-2, sy-12, 4, 24);

        // direction arrow to totem (when it's off-screen and player is outside)
        if (!totem.inZone){
          renderOffscreenArrow(ctx, camX, camY, w, h, player.x, player.y, totem.x, totem.y, "totem");
        }
      }

      // chest
      if (chests.length){
        const c = chests[0];
        const sx=c.x-camX, sy=c.y-camY;
        const bob = Math.sin(c.t*3 + c.bob)*3;
        const isSpecial = !!c.special;
        const glowCol = isSpecial ? "rgba(255,90,90,1)" : "rgba(255,220,120,1)";
        const fillCol = isSpecial ? "rgba(255,90,90,0.95)" : "rgba(255,220,120,0.95)";
        const strokeCol = isSpecial ? "rgba(255,200,200,0.55)" : "rgba(255,255,255,0.35)";
        const stripeCol = isSpecial ? "rgba(255,230,230,0.55)" : "rgba(255,255,255,0.55)";
        const chestW = c.r * 2.25;
        const chestH = c.r * 1.625;
        const chestR = Math.max(5, c.r * 0.45);
        const glowR = c.r * 1.25;

        ctx.globalAlpha = 0.15;
        ctx.fillStyle = glowCol;
        ctx.beginPath();
        ctx.arc(sx, sy+10, glowR, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.fillStyle = fillCol;
        ctx.beginPath();
        ctx.roundRect(sx - chestW * 0.5, sy - chestH * 0.5 + bob, chestW, chestH, chestR);
        ctx.fill();
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = stripeCol;
        ctx.fillRect(sx-2, sy - chestH * 0.5 + bob, 4, chestH);

        // direction arrow to chest (when it's off-screen)
        renderOffscreenArrow(ctx, camX, camY, w, h, player.x, player.y, c.x, c.y, isSpecial ? "specialChest" : "chest");
      }

      // drops
      for (const d of drops){
        const sx=d.x-camX, sy=d.y-camY;
        if (d.kind === "heal"){
          const pulse = 0.6 + 0.4 * Math.sin((d.pulse || 0) + state.t * 6);
          ctx.save();
          ctx.shadowColor = "rgba(120,255,140,0.9)";
          ctx.shadowBlur = 14 * pulse;
          ctx.beginPath();
          ctx.fillStyle = "rgba(120,230,140,0.95)";
          ctx.arc(sx,sy,d.r * (0.95 + 0.12 * pulse),0,TAU);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.fillStyle = "rgba(120,220,255,0.9)";
          ctx.arc(sx,sy,d.r,0,TAU);
          ctx.fill();
          ctx.beginPath();
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.arc(sx-2,sy-2,2,0,TAU);
          ctx.fill();
        }
      }

      // enemy bullets
      for (const b of enemyBullets){
        const sx=b.x-camX, sy=b.y-camY;
        if (b.trail === "sniper"){
          const spd = len2(b.vx, b.vy) || 1;
          const ux = b.vx / spd;
          const uy = b.vy / spd;
          const stepDist = Math.max(5, b.r * 1.9);
          const steps = 3;
          const headCol = b.color || "rgba(120,220,255,0.95)";
          const tailCol = b.trailColor || "rgba(200,230,255,0.75)";
          const glowCol = b.glow || "rgba(180,220,255,0.7)";
          ctx.save();
          ctx.fillStyle = tailCol;
          ctx.shadowColor = glowCol;
          ctx.shadowBlur = 14;
          for (let i=1; i<=steps; i++){
            const p = 1 - i / (steps + 1);
            ctx.globalAlpha = 0.18 + 0.12 * p;
            const r = b.r * (0.65 + 0.2 * p);
            ctx.beginPath();
            ctx.arc(sx - ux * stepDist * i, sy - uy * stepDist * i, r, 0, TAU);
            ctx.fill();
          }
          ctx.globalAlpha = 0.95;
          ctx.beginPath();
          ctx.fillStyle = headCol;
          ctx.arc(sx, sy, b.r, 0, TAU);
          ctx.fill();
          ctx.restore();
          continue;
        }
        const col = b.color || "rgba(255,140,160,0.9)";
        if (b.glow){
          ctx.save();
          ctx.shadowColor = b.glow;
          ctx.shadowBlur = b.glowBlur || 14;
          ctx.beginPath();
          ctx.fillStyle = col
          ctx.arc(sx,sy,b.r,0,TAU);
          ctx.fill();
          ctx.restore();
        } else {
          batchMapPush(batch.enemyBullets, col, sx, sy, b.r);
        }
      }
      for (const [col, arr] of batch.enemyBullets){
        batchCircleDraw(ctx, arr, col);
      }

      // aura
      if (player.aura){
        const sx=player.x-camX, sy=player.y-camY;
        ctx.globalAlpha = 0.10;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.arc(sx,sy, player.auraRadius, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (player.aura && clones.length){
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = "rgba(200,230,255,0.75)";
        for (const sc of clones){
          const sx = sc.x - camX;
          const sy = sc.y - camY;
          ctx.beginPath();
          ctx.arc(sx, sy, player.auraRadius, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }
      if (state.auraWaveActive){
        const wx = state.auraWaveX - camX;
        const wy = state.auraWaveY - camY;
        const drawMax = state.auraWaveMaxR + AURA_WAVE_THICKNESS * 0.1;
        const drawR = Math.min(state.auraWaveR, drawMax);
        const fade = 1 - clamp(drawR / Math.max(1, drawMax), 0, 1);
        ctx.save();
        const mainAlpha = 0.22 + 0.18 * fade;
        ctx.strokeStyle = "rgba(200,230,255,0.9)";
        ctx.shadowColor = "rgba(120,210,255,0.55)";
        ctx.shadowBlur = 18;
        ctx.lineCap = "round";
        ctx.globalAlpha = mainAlpha * 0.45;
        ctx.lineWidth = Math.max(4, AURA_WAVE_THICKNESS * 0.7);
        ctx.beginPath();
        ctx.arc(wx, wy, drawR, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = mainAlpha * 0.25;
        ctx.lineWidth = Math.max(7, AURA_WAVE_THICKNESS * 1.1);
        ctx.beginPath();
        ctx.arc(wx, wy, drawR, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = mainAlpha;
        ctx.lineWidth = Math.max(2, AURA_WAVE_THICKNESS * 0.25);
        ctx.beginPath();
        ctx.arc(wx, wy, drawR, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }

      // bullets
      for (const b of bullets){
        const sx=b.x-camX, sy=b.y-camY;
        if (b.isNova){
          const spd = len2(b.vx, b.vy) || 1;
          const ux = b.vx / spd;
          const uy = b.vy / spd;
          const tx = sx - ux * 20;
          const ty = sy - uy * 20;
          const px = -uy;
          const py = ux;
          const w0 = Math.max(3, b.r * 0.9);
          const w1 = Math.max(0.8, b.r * 0.2);
          ctx.save();
          ctx.beginPath();
          ctx.fillStyle="rgba(190,140,255,0.35)";
          ctx.moveTo(sx + px * w0, sy + py * w0);
          ctx.lineTo(sx - px * w0, sy - py * w0);
          ctx.lineTo(tx - px * w1, ty - py * w1);
          ctx.lineTo(tx + px * w1, ty + py * w1);
          ctx.closePath();
          ctx.fill();

          ctx.shadowColor = "rgba(190,140,255,0.8)";
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.fillStyle="rgba(220,190,255,0.95)";
          ctx.arc(sx,sy,b.r,0,TAU);
          ctx.fill();
          ctx.restore();
        } else {
          batchCirclePush(batch.bullets, sx, sy, b.r);
        }
      }
      batchCircleDraw(ctx, batch.bullets, "rgba(255,245,210,0.95)");

      // dog
      if (dogs.length){
        for (const d of dogs){
          const sx = d.x - camX;
          const sy = d.y - camY;
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(d.ang);
          ctx.beginPath();
          ctx.fillStyle = d.color || DOG_BROWN_COLORS[0];
          ctx.arc(0, 0, d.r, 0, TAU);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fillRect(-d.r * 0.6, -d.r * 0.2, d.r * 1.2, d.r * 0.4);
          ctx.restore();
        }
      }

      // enemies
      for (const e of enemies){
        const sx=e.x-camX, sy=e.y-camY;
        let baseCol = e.type==="boss" ? "rgba(210,120,255,0.95)" : "rgba(255,120,140,0.92)";
        if (e.type==="tank") baseCol="rgba(255,90,90,0.95)";
        if (e.type==="runner") baseCol="rgba(255,160,90,0.95)";
        if (e.type==="shooter") baseCol="rgba(120,255,190,0.92)";
        if (e.type==="bomber") baseCol="rgba(255,220,120,0.92)";
        if (e.type==="triad") baseCol="rgba(160,190,255,0.95)";
        if (e.type==="blaster") baseCol="rgba(140,190,255,0.95)";
        if (e.type==="burst") baseCol="rgba(180,200,255,0.95)";
        if (e.type==="boss"){
          if (e.bossKind==="sniper") baseCol = "rgba(120,220,255,0.95)";
          if (e.bossKind==="charger") baseCol = "rgba(255,180,120,0.95)";
          if (e.bossKind==="spiral") baseCol = "rgba(200,140,255,0.95)";
          if (e.bossKind==="summoner") baseCol = "rgba(160,255,160,0.92)";
        }
        if (e.type==="boss"){
          const waveT = (state.t * 0.55 + e.id * 0.17) % 1;
          const waveR = e.r + 12 + waveT * 78;
          ctx.save();
          ctx.globalAlpha = 0.28 * (1 - waveT);
          ctx.strokeStyle = baseCol;
          ctx.lineWidth = 2 + waveT * 2;
          ctx.beginPath();
          ctx.arc(sx, sy, waveR, 0, TAU);
          ctx.stroke();
          ctx.restore();
        }
        let blasterCharge = 0;
        let blasterFillFromBack = true;
        if (e.type === "blaster"){
          const cd = e.burstCooldown || 1.0;
          if ((e.blastKind || 0) === 1){
            if ((e.holdT || 0) > 0) blasterCharge = 1;
            else if ((e.burstCd || 0) > 0) blasterCharge = clamp(1 - ((e.burstCd || 0) / cd), 0, 1);
            else blasterCharge = 1;
          } else {
            if ((e.burstLeft || 0) > 0 && (e.burstTotal || 0) > 0){
              blasterCharge = clamp((e.burstLeft || 0) / (e.burstTotal || 1), 0, 1);
              blasterFillFromBack = false;
            } else if ((e.burstCd || 0) > 0){
              blasterCharge = clamp(1 - ((e.burstCd || 0) / cd), 0, 1);
            } else {
              blasterCharge = 1;
            }
          }
        }
        if (e.type === "triad"){
          const rad = e.triRad || 22;
          const a0 = e.triAngle || 0;
          ctx.globalAlpha = 0.75;
          ctx.fillStyle = "rgba(140,180,255,0.45)";
          ctx.beginPath();
          for (let k=0; k<3; k++){
            const ang = a0 + k*(TAU/3);
            const vx = sx + Math.cos(ang) * rad;
            const vy = sy + Math.sin(ang) * rad;
            if (k === 0) ctx.moveTo(vx, vy);
            else ctx.lineTo(vx, vy);
          }
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        ctx.save();
        if (e.type === "blaster" && blasterCharge > 0){
          ctx.shadowColor = e.bulletGlow || "rgba(255,230,140,0.95)";
          ctx.shadowBlur = 16 + blasterCharge * 18;
        }
        const auraFlash = (e.auraFlash || 0) > 0;
        if (e.hitFlash > 0){
          if (e.type === "boss"){
            ctx.beginPath();
            ctx.fillStyle = baseCol;
            ctx.arc(sx,sy,e.r,0,TAU);
            ctx.fill();
            ctx.globalAlpha = 0.75;
            ctx.beginPath();
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.arc(sx,sy,e.r,0,TAU);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.arc(sx,sy,e.r,0,TAU);
            ctx.fill();
          }
        } else if (auraFlash) {
          ctx.beginPath();
          ctx.fillStyle = baseCol;
          ctx.arc(sx,sy,e.r,0,TAU);
          ctx.fill();
          ctx.globalAlpha = 0.60;
          ctx.beginPath();
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.arc(sx,sy,e.r,0,TAU);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.fillStyle = baseCol;
          ctx.arc(sx,sy,e.r,0,TAU);
          ctx.fill();
        }
        ctx.restore();

        if (e.type === "blaster"){
          if (blasterCharge > 0){
            const dirX = e.moveDirX || 1;
            const dirY = e.moveDirY || 0;
            const ang = Math.atan2(dirY, dirX);
            const rr = e.r;
            const fillW = (rr * 2) * blasterCharge;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(ang);
            ctx.beginPath();
            ctx.arc(0, 0, rr, 0, TAU);
            ctx.clip();
            ctx.globalAlpha = 0.95;
            ctx.shadowColor = e.bulletGlow || "rgba(255,230,140,0.95)";
            ctx.shadowBlur = 26;
            ctx.fillStyle = e.bulletColor || "rgba(255,235,120,0.98)";
            const x0 = blasterFillFromBack ? -rr : (rr - fillW);
            ctx.fillRect(x0, -rr, fillW, rr * 2);
            ctx.restore();
          }
        }

        if (e.dying){
          const p = clamp(1 - (e.deathT / BURST_TELEGRAPH), 0, 1);
          ctx.globalAlpha = 0.9;
          ctx.lineWidth = 2 + p * 3;
          ctx.strokeStyle = "rgba(255,230,150,0.95)";
          ctx.beginPath();
          ctx.arc(sx,sy,e.r + 6 + p * 6,0,TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        if (e.elite){
          const pulse = 0.5 + 0.5 * Math.sin(state.t * 5 + e.id * 0.7);
          ctx.globalAlpha = 0.55 + pulse * 0.25;
          ctx.lineWidth = 3;
          ctx.strokeStyle = e.eliteColor || "rgba(255,220,120,0.9)";
          ctx.beginPath();
          ctx.arc(sx,sy,e.r + 5 + pulse * 4,0,TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        if (e.type==="boss" || e.type==="tank"){
          ctx.globalAlpha=0.7;
          ctx.lineWidth=3;
          ctx.strokeStyle="rgba(0,0,0,0.35)";
          ctx.beginPath();
          ctx.arc(sx,sy,e.r+3,0,TAU);
          ctx.stroke();

          const p = clamp(e.hp/e.hpMax,0,1);
          ctx.strokeStyle="rgba(255,255,255,0.65)";
          ctx.beginPath();
          ctx.arc(sx,sy,e.r+3,-Math.PI/2,-Math.PI/2+TAU*p);
          ctx.stroke();
          ctx.globalAlpha=1;
        }
      }

      // turrets
      for (const t of turrets){
        const sx=t.x-camX, sy=t.y-camY;
        const hs = t.size * 0.5;
        ctx.fillStyle="rgba(120,220,255,0.9)";
        ctx.beginPath();
        ctx.roundRect(sx-hs, sy-hs, t.size, t.size, 5);
        ctx.fill();

        ctx.fillStyle="rgba(255,255,255,0.7)";
        ctx.fillRect(sx-2, sy-hs-4, 4, 8);

        const p = clamp(t.hp/t.hpMax, 0, 1);
        ctx.strokeStyle="rgba(255,255,255,0.7)";
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.arc(sx,sy, hs + 4, -Math.PI/2, -Math.PI/2 + TAU*p);
        ctx.stroke();
      }

      // lightning
      if (lightningStrikes.length){
        for (const s of lightningStrikes){
          const alpha = 1 - (s.t / s.life);
          ctx.save();
          ctx.globalAlpha = 0.85 * alpha;
          ctx.lineWidth = 2 + 2 * alpha;
          ctx.strokeStyle = "rgba(180,220,255,0.95)";
          ctx.shadowColor = "rgba(180,220,255,0.9)";
          ctx.shadowBlur = 18;
          ctx.beginPath();
          const pts = s.pts || [];
          if (pts.length){
            ctx.moveTo(pts[0].x - camX, pts[0].y - camY);
            for (let i=1; i<pts.length; i++){
              const p = pts[i];
              ctx.lineTo(p.x - camX, p.y - camY);
            }
            ctx.stroke();
          }
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = 0.9 * alpha;
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.shadowColor = "rgba(180,220,255,0.9)";
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(s.x - camX, s.y - camY, 6 + 6 * alpha, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
      }

      // shockwaves
      if (shockwaves.length){
        for (const s of shockwaves){
          const p = clamp(s.t / Math.max(0.001, s.life), 0, 1);
          const r = lerp(s.r0, s.r1, p);
          const a = 1 - p;
          ctx.save();
          ctx.globalAlpha = 0.85 * a;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 2 + 5 * a;
          ctx.shadowColor = s.color;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(s.x - camX, s.y - camY, r, 0, TAU);
          ctx.stroke();
          ctx.restore();
        }
      }

      // particles
      ctx.globalAlpha = 0.8;
      for (const p of particles){
        const sx=p.x-camX, sy=p.y-camY;
        const a = 1 - (p.t/p.life);
        ctx.globalAlpha = 0.85*a;
        ctx.beginPath();
        ctx.fillStyle="rgba(255,255,255,0.9)";
        ctx.arc(sx,sy, p.r, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // orbitals
      if (player.orbitals>0){
        const orbSize = getOrbitalSize();
        for(let k=0;k<player.orbitals;k++){
          const a = orbitalAngle + (k/Math.max(1,player.orbitals))*TAU;
          const ox = player.x + Math.cos(a)*player.orbitalRadius;
          const oy = player.y + Math.sin(a)*player.orbitalRadius;
          const sx=ox-camX, sy=oy-camY;
          batchCirclePush(batch.orbitals, sx, sy, orbSize);
        }
        batchCircleDraw(ctx, batch.orbitals, "rgba(210,230,255,0.95)");
      }
      if (player.orbitals>0 && clones.length){
        const orbSize = getOrbitalSize();
        for (const sc of clones){
          const base = sc.orbitalAngle || 0;
          for(let k=0;k<player.orbitals;k++){
            const a = base + (k/Math.max(1,player.orbitals))*TAU;
            const ox = sc.x + Math.cos(a)*player.orbitalRadius;
            const oy = sc.y + Math.sin(a)*player.orbitalRadius;
            const sx=ox-camX, sy=oy-camY;
            batchCirclePush(batch.orbitalsClone, sx, sy, orbSize);
          }
        }
        batchCircleDraw(ctx, batch.orbitalsClone, "rgba(180,210,255,0.7)");
      }

      // magnet radius
      {
        const sx = player.x - camX;
        const sy = player.y - camY;

        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = "rgba(120,220,255,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, player.magnet, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // same circle clones
      if (clones.length){
        for (const sc of clones){
          const sx = sc.x - camX;
          const sy = sc.y - camY;
          const t = clamp(sc.t / Math.max(0.001, sc.life), 0, 1);
          const alpha = 0.45 + 0.25 * (1 - t);
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "rgba(200,230,255,0.75)";
          ctx.beginPath();
          ctx.arc(sx, sy, player.r * 0.95, 0, TAU);
          ctx.fill();
          ctx.globalAlpha = 0.8;
          ctx.strokeStyle = "rgba(120,200,255,0.6)";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }

      // dash trail
      if (dashTrail.length){
        ctx.save();
        ctx.fillStyle = "rgba(200,230,255,0.9)";
        ctx.shadowColor = "rgba(180,220,255,0.7)";
        ctx.shadowBlur = 18;
        for (const d of dashTrail){
          const p = 1 - (d.t / d.life);
          const alpha = 0.22 * p;
          const r = d.r * (0.75 + 0.25 * p);
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(d.x - camX, d.y - camY, r, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // player
      {
        const sx=player.x-camX, sy=player.y-camY;
        ctx.beginPath();
        const blink = player.invuln>0 && (Math.floor(performance.now()/60)%2===0);
        ctx.fillStyle = blink ? "rgba(255,255,255,0.9)" : "rgba(210,230,255,0.95)";
        ctx.arc(sx,sy, player.r, 0, TAU);
        ctx.fill();
      }

      // heal floaters
      if (floaters.length){
        ctx.save();
        const baseSize = 18;
        const baseFont = "system-ui,-apple-system,Segoe UI,Roboto,Arial";
        ctx.font = `700 ${baseSize}px ${baseFont}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (const f of floaters){
          const sx = f.x - camX;
          const sy = f.y - camY;
          const a = 1 - (f.t / f.life);
          ctx.globalAlpha = 0.9 * a;
          if (f.size && f.size !== baseSize){
            ctx.font = `700 ${f.size}px ${baseFont}`;
          } else if (ctx.font !== `700 ${baseSize}px ${baseFont}`){
            ctx.font = `700 ${baseSize}px ${baseFont}`;
          }
          ctx.fillStyle = f.color || "rgba(120,255,140,0.95)";
          ctx.fillText(f.text, sx, sy);
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // vignette
      const grd = ctx.createRadialGradient(w*0.5,h*0.5, Math.min(w,h)*0.15, w*0.5,h*0.5, Math.max(w,h)*0.75);
      const hpRatio = player.hpMax > 0 ? player.hp / player.hpMax : 1;
      const low = clamp((0.5 - hpRatio) / 0.5, 0, 1);
      let edgeColor = "rgba(0,0,0,0.55)";
      if (low > 0){
        const pulse = 0.6 + 0.4 * Math.sin(state.t * 6);
        const r = Math.round(255 + (200 - 255) * low);
        const g = Math.round(140 + (20 - 140) * low);
        const b = Math.round(60 + (20 - 60) * low);
        const alpha = (0.45 + 0.25 * low) * pulse;
        edgeColor = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
      }
      grd.addColorStop(0,"rgba(0,0,0,0)");
      grd.addColorStop(1, edgeColor);
      ctx.fillStyle=grd;
      ctx.fillRect(0,0,w,h);
    }

    // start
    openMainMenu();
    startLoop(step);

  } catch (err) {
    crash(err);
  }

})();
