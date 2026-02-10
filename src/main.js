import {
  HEAL_OVER_TIME,
  CAMERA_ZOOM_OUT,
  XP_BONUS_NORMAL,
  XP_BONUS_ELITE,
  XP_BONUS_BOSS,
  INVULN_CONTACT_BASE,
  INVULN_CONTACT_MIN,
} from "./content/config.js";
import { COLOSSUS_HP_STEP, COLOSSUS_SHRINK_STEP, COLOSSUS_SPAWN_STAGES, BURST_TELEGRAPH } from "./content/enemies.js";
import { DOG_BROWN_COLORS } from "./content/dog.js";
import { TAU } from "./core/constants.js";
import { initCanvas } from "./core/canvas.js";
import { clamp, lerp, len2 } from "./utils/math.js";
import { randf, randi } from "./utils/rand.js";
import { circleHit, circleRectHit, pushAway } from "./utils/collision.js";
import { AURA_WAVE_THICKNESS, createUpgrades } from "./content/upgrades.js";
import { createUniques } from "./content/uniques.js";
import { getPlayerClass } from "./content/players.js";
import { initState } from "./core/init.js";
import { createPlayerFunctions } from "./core/player.js";
import { createDeathHelpers } from "./core/death_helpers.js";
import { startLoop } from "./core/loop.js";
import { createStep } from "./flow/step.js";
import { createUpdateMovement } from "./systems/movement.js";
import { createSpatialGrid } from "./systems/spatial_grid.js";
import { createTargeting } from "./systems/targeting.js";
import { createInputSystem } from "./systems/input.js";
import {
  createRicochetHelpers,
  createShootingSystem,
  createDamageTracker,
  createPlayerDamageApplier,
} from "./systems/combat.js";
import { createUpdateDogs } from "./systems/uniques/dog.js";
import { createDashSystem } from "./systems/uniques/dash.js";
import { createMaxShirtSystem } from "./systems/uniques/max_shirt.js";
import { createTryConsumeSpareTire } from "./systems/uniques/spare_tire.js";
import { createAuraSystem } from "./systems/upgrades/aura.js";
import { createUpdateSameCircle } from "./systems/uniques/same_circle.js";
import { createUpdatePatriarchDoll } from "./systems/patriarch_doll.js";
import { createUpdateBullets, createUpdateEnemyBullets } from "./systems/projectiles.js";
import { createUpdateTotem } from "./systems/totem.js";
import { createUpdateDrops } from "./systems/drops.js";
import { createOrbitalsSystem } from "./systems/upgrades/orbitals.js";
import {
  createRenderBatch,
  batchCirclePush,
  batchCircleDraw,
  batchMapPush,
  batchMapClear,
  ensureRoundRectPolyfill,
} from "./systems/render.js";
import { renderOffscreenArrow } from "./render/ui/arrows.js";
import { COLORS } from "./render/colors.js";
import { createEffectRenderer } from "./render/effects/render.js";
import {
  createSpawnBoss,
  createSpawnChest,
  createSpawnColossusElite,
  createSpawnEnemy,
  createSpawnTotem,
  createSpawnTurret,
  createSpawnDog,
  updateSpawning,
} from "./systems/spawning.js";
import { initHud } from "./ui/hud.js";
import { initOverlays } from "./ui/overlays.js";
import { bindOptionsUI } from "./ui/options.js";
import { createUpdateUi } from "./ui/update.js";
import { createBuildUI } from "./ui/updates/build.js";
import { createUpgradePicker } from "./ui/upgrade_picker.js";
import { createMenus } from "./ui/menus.js";
import { bindMiscUI } from "./ui/misc.js";
import { createEffectSpawns } from "./render/effects/spawn.js";
import { createEffectUpdates } from "./render/effects/update.js";

// import { renderSpatialGrid } from "./render/debug.js";
import { createProfilerUI } from "./ui/profiler.js";

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
    const { elBossWrap } = hud;
    // Overlays
    const { pauseMenu, btnHang } = overlays;

    // Profiler
    const profiler = createProfilerUI();

    const { updateUI, forceUpdateRerollsUI, forceUpdatePlayerHpBar } = createUpdateUi({ hud, overlays });

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

    // State
    const { player, state, ui, entities, spawn, effects } = initState();
    const {
      bullets,
      enemyBullets,
      enemies,
      turrets,
      drops,
      clones,
      dogs,
      chests,
      totem,
    } = entities;
    const {
      particles,
      shockwaves,
      lightningStrikes,
      floaters,
      dashTrail,
    } = effects;
    const {
      spawnBurst,
      spawnShockwave,
      spawnDashTrail,
      spawnLightningStrike,
      spawnHealFloat,
      spawnDamageFloat,
    } = createEffectSpawns({
      player,
      particles,
      shockwaves,
      lightningStrikes,
      floaters,
      dashTrail,
    });
    const {
      updateDashTrail,
      updateLightning,
      updateParticles,
      updateShockwaves,
      updateFloaters,
    } = createEffectUpdates({
      state,
      dashTrail,
      lightningStrikes,
      particles,
      shockwaves,
      floaters,
    });
    const {
      renderLightning,
      renderShockwaves,
      renderParticles,
      renderDashTrail,
      renderFloaters,
    } = createEffectRenderer({
      particles,
      shockwaves,
      lightningStrikes,
      floaters,
      dashTrail,
    });
    const { gridBuild, gridQueryCircle, getGridCells } = createSpatialGrid(enemies);
    const targeting = createTargeting({ enemies, gridQueryCircle });
    const {
      canRicochet,
      tryFindRicochetTarget,
      applyRicochetRedirect,
      spawnCheapRicochetSplits,
    } = createRicochetHelpers({ bullets, targeting });

    const { options, applyOptionsToUI } = bindOptionsUI({
      overlays,
      onOptionsChange: (nextOptions) => {
        const profileIsEnabled = !!nextOptions.showProfiler;
        profiler.isEnabled = profileIsEnabled;
        profiler.elProfiler.style.display = profileIsEnabled ? "block" : "none";
      },
    });

    const { recordDamage, getDps } = createDamageTracker({ state, player, options, spawnDamageFloat, spawnHealFloat});
    const applyDamageToPlayer = createPlayerDamageApplier({ state, player, options, spawnDamageFloat });
    const spawnDog = createSpawnDog({ player, dogs });
    const UNIQUES = createUniques({ player, state, totem, spawnDog });
    const pF = createPlayerFunctions({ player, totem, uniques: UNIQUES });
    const UPGRADES = createUpgrades({ player, state, pF });

    const updateBuildUI = createBuildUI({
      overlays,
      player,
      state,
      ui,
      pF,
      UNIQUES,
      UPGRADES,
      getDps,
    });

    const {
      openUpgradePicker,
      maybeOpenLevelPicker,
      pickChoice,
      doReroll,
    } = createUpgradePicker({
      state,
      ui,
      player,
      pF,
      UPGRADES,
      UNIQUES,
      overlays,
      updateBuildUI,
      forceUpdateRerollsUI,
    });

    // Characters
    function maybeAddStartingDog(heroId){
      const hero = getPlayerClass(heroId);
      const chance = hero ? (hero.dogStartChance || 0) : 0;
      if (chance > 0 && Math.random() < chance) pF.addUniqueItem("dog");
    }

    function handleSelectHero(hero){
      hero.apply(player);
      maybeAddStartingDog(hero.id);
    }

    const menus = createMenus({
      state,
      player,
      ui,
      overlays,
      updateBuildUI,
      applyOptionsToUI,
      handleSelectHero,
    });
    bindMiscUI({ overlays, player, state });

    // Input
    const input = createInputSystem({
      canvas,
      joy,
      knob,
      isTouch,
      menus,
      pF,
      pickChoice,
      doReroll,
      overlays,
    });
    const { keys, joyVec } = input;

    const updateMovement = createUpdateMovement({ keys, isTouch, joyVec, player, state, turrets });

    const triggerDash = createDashSystem({ player, state, pF, keys, isTouch, joyVec, spawnDashTrail });
    const maxShirt = createMaxShirtSystem({ state, pF });
    input.setActionHandler(()=>{
      if (state.paused || state.dead) return;
      maxShirt.tryActivateMaxShirt();
      triggerDash();
    });

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

    const tryConsumeSpareTire = createTryConsumeSpareTire({ pF, player, spawnBurst, pauseMenu, updateBuildUI });
    const { formatDeathReason, handlePlayerDeath } = createDeathHelpers({
      state,
      player,
      menus,
      forceUpdatePlayerHpBar,
      tryConsumeSpareTire,
    });

    function gainXp(v){
      const mult = player.xpGainMult * (1 + (state.xpEnemyBonus || 0));
      player.xp += v * mult;
      while(player.xp >= player.xpNeed && !state.dead){
        player.xp -= player.xpNeed;
        player.lvl += 1;
        player.xpNeed = Math.floor(player.xpNeed * 1.12 * player.xpNeedMult + 8);
        state.chestTimer = Math.min(state.chestTimer, pF.getChestInterval());
        state.pendingLevelUps += 1;
      }
      maybeOpenLevelPicker();
    }

    // Enemies
    const spawnEnemy = createSpawnEnemy({ player, state, enemies, spawnScale: SPAWN_SCALE });
    const spawnBoss = createSpawnBoss({ spawn, spawnEnemy, elBossWrap });
    const spawnColossusElite = createSpawnColossusElite({ player, state, spawnEnemy, });

    // Chest
    const spawnChest = createSpawnChest({ state, chests, totem, player, pF });
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
    const spawnTotem = createSpawnTotem({ player, totem, pF });

    // Turret
    const spawnTurret = createSpawnTurret({ player, turrets, pF, });

    const shooting = createShootingSystem({ player, bullets, pF, targeting, spawnTurret });

    function getEnemyTarget(e){
      if (e.type === "boss") return { x: player.x, y: player.y, turret: null };
      const aggro = pF.getTurretAggroRadius();
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

    function updateTurrets(dt){
      for (let i=turrets.length-1; i>=0; i--){
        const t = turrets[i];
        const size = pF.getTurretSize();
        const hpMax = pF.getTurretHpMax();
        t.size = size;
        t.r = size * 0.5;
        if (t.hpMax !== hpMax){
          const delta = hpMax - t.hpMax;
          t.hpMax = hpMax;
          t.hp = Math.min(hpMax, t.hp + delta);
        }
        t.hitCd = Math.max(0, t.hitCd - dt);
        if (t.hp <= 0){ turrets.splice(i,1); continue; }

        shooting.tryFireTurret(t, dt);
      }
    }

    const { updateOrbitalsFor, updateOrbitals } = createOrbitalsSystem({
      player,
      state,
      pF,
      gridQueryCircle,
      recordDamage,
      killEnemy,
    });
    const { applyAuraFor, applyAura } = createAuraSystem({
      state,
      player,
      pF,
      gridQueryCircle,
      recordDamage,
      killEnemy,
    });

    const updateSameCircle = createUpdateSameCircle({
      pF,
      state,
      clones,
      player,
      enemies,
      shooting,
      updateOrbitalsFor,
      applyAuraFor,
      recordDamage,
      killEnemy,
      spawnBurst,
      spawnShockwave,
    });

    function enemyShoot(e, dt, tx, ty){
      if (!e.shotRate) return;

      const tier = e.bossTier || 0;
      const shootBullet = (x, y, ang, spd, dmg, r=4, life=3.2, extra=null) => {
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
          color: COLORS.blueBright95,
          glow: COLORS.blueBright85,
          trailColor: COLORS.blueTrail60,
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

      spawnBurst(e.x, e.y, randi(24, 34), 340, 0.50);

      // damage player
      const dxp = player.x - e.x, dyp = player.y - e.y;
      const dp = len2(dxp, dyp);
      if (dp < e.explodeR && player.invuln <= 0){
        const mult = 1 - (dp / e.explodeR); // 0..1
        const dmg = e.explodeDmg * (0.55 + 0.45 * mult);
        applyDamageToPlayer(dmg, true, true);
        const baseInvuln = pF.getInvulnDuration(INVULN_CONTACT_BASE, INVULN_CONTACT_MIN);
        player.invuln = pF.getInvulnAfterHit(baseInvuln);

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
            spawnBurst(tur.x,tur.y, randi(8,12), 220, 0.30);
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
      maxShirt.onEnemyKill();
      spawnBurst(e.x,e.y, randi(10,16), 220, 0.35);
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
        if (spawn.bossActive <= 0) elBossWrap.style.display = "none";
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

    btnHang.addEventListener("click", ()=>{
      if (!pF.hasUnique("rope")) return;
      handlePlayerDeath("(он все таки смог)");
    });

    // Loop
    const step = createStep({
      state,
      player,
      entities,
      profiler,
      update,
      realtimeUpdate,
      render,
    });

    const updateDogs = createUpdateDogs({ player, dogs, pF, gridQueryCircle, recordDamage, killEnemy });

    const updatePatriarchDoll = createUpdatePatriarchDoll({
      pF,
      state,
      player,
      enemies,
      spawnLightningStrike,
      recordDamage,
      spawnBurst,
      killEnemy,
    });

    const updateBullets = createUpdateBullets({
      bullets,
      player,
      pF,
      gridQueryCircle,
      canRicochet,
      tryFindRicochetTarget,
      applyRicochetRedirect,
      spawnCheapRicochetSplits,
      killEnemy,
      recordDamage,
    });

    const updateEnemyBullets = createUpdateEnemyBullets({
      enemyBullets,
      turrets,
      player,
      pF,
      spawnBurst,
      applyDamageToPlayer,
      handlePlayerDeath,
      formatDeathReason,
    });

    const updateTotem = createUpdateTotem({ totem, player, pF, applyDamageToPlayer, handlePlayerDeath });
    const updateDrops = createUpdateDrops({ drops, player, bullets, turrets, pF, queueHeal, gainXp });

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
        pF,
      });

      const moveSpeed = pF.getMoveSpeed();
      updateMovement({ dt, lerpFast, moveSpeed });

      const spd = len2(player.vx, player.vy) || 0;
      const ratio = clamp(spd / Math.max(1, moveSpeed), 0, 1);
      const baseSpd = pF.getBaseMoveSpeed();
      const speedBonus = moveSpeed / baseSpd;
      const targetScale = GAME_SCALE * (1 - CAMERA_ZOOM_OUT * speedBonus * ratio);
      cameraScale = lerp(cameraScale, targetScale, lerpFast);

      // regen + invuln
      if (player.regen > 0 && player.hp > 0){
        player.hp = Math.min(player.hpMax, player.hp + player.regen*dt);
      }
      updateHeal(dt);
      player.invuln = Math.max(0, player.invuln - dt);

      maxShirt.updateMaxShirt(dt);

      // totem zone effect
      updateTotem(dt);
      if (state.dead) return;

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
      shooting.shoot(dt);
      shooting.shootNova(dt);
      updateOrbitals(dt);
      applyAura(dt);
      updateDogs(dt);
      updateSameCircle(dt);
      updatePatriarchDoll(dt);

      updateDashTrail(dt, spawnDashTrail);
      updateLightning(dt);

      // bullets
      updateBullets(dt);

      // enemy bullets
      updateEnemyBullets(dt);
      if (state.dead) return;

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
            const baseInvuln = pF.getInvulnDuration(INVULN_CONTACT_BASE, INVULN_CONTACT_MIN);
            player.invuln = pF.getInvulnAfterHit(baseInvuln);
            spawnBurst(player.x,player.y, randi(12,20), 260, 0.35);
            if (player.hp<=0){
              if (handlePlayerDeath(formatDeathReason("contact", e.type, e.bossKind))) return;
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
                spawnBurst(tur.x,tur.y, randi(6,10), 200, 0.25);
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
      updateDrops(dt, dampFast);

      updateParticles(dt, dampSlow);
      updateShockwaves(dt);
      updateFloaters(dt, dampSlow);
    }

    function realtimeUpdate(dtRaw){
      updateUI({
        dtRaw,
        player,
        state,
        entities,
        spawn,
        pF,
        getDps,
        isTouch,
        uniques: UNIQUES,
      });
    }

    function render(){
      ctx.setTransform(getDpr() * cameraScale, 0, 0, getDpr() * cameraScale, 0, 0);
      const w = innerWidth  / cameraScale;
      const h = innerHeight / cameraScale;

      const camX = player.x - w*0.5;
      const camY = player.y - h*0.5;

      ctx.fillStyle = COLORS.bg;
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
      ctx.strokeStyle = COLORS.white08;
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

      // debug
      // renderSpatialGrid(ctx, camX, camY, getGridCells());

      // totem
      if (totem.active){
        const sx=totem.x-camX, sy=totem.y-camY;
        const pulse = 0.5 + 0.5 * Math.sin(totem.t * 2.6);
        const inner = totem.r * (0.15 + 0.55 * pulse);
        const grad = ctx.createRadialGradient(sx, sy, inner, sx, sy, totem.r);
        grad.addColorStop(0, COLORS.tealTotem0);
        grad.addColorStop(0.55, `rgba(${COLORS.tealTotemRgb},${0.05 + 0.06 * pulse})`);
        grad.addColorStop(1, `rgba(${COLORS.tealTotemRgb},${0.12 + 0.12 * pulse})`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, totem.r, 0, TAU);
        ctx.fill();

        const lifeLeft = Math.max(0, Math.ceil(totem.life));
        const fontSize = Math.max(32, totem.r * 0.75);
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = COLORS.mintText38;
        ctx.strokeStyle = COLORS.black25;
        ctx.lineWidth = Math.max(2, fontSize * 0.03);
        ctx.font = `900 ${fontSize}px system-ui,-apple-system,Segoe UI,Roboto,Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.strokeText(String(lifeLeft), sx, sy);
        ctx.fillText(String(lifeLeft), sx, sy);
        ctx.restore();

        ctx.globalAlpha = 0.55 + 0.12 * pulse;
        ctx.strokeStyle = COLORS.tealTotem55;
        ctx.lineWidth = 2 + 2 * pulse;
        ctx.beginPath();
        ctx.arc(sx, sy, totem.r, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.save();
        ctx.shadowColor = COLORS.tealTotem55;
        ctx.shadowBlur = 18 + 8 * pulse;
        ctx.fillStyle = COLORS.tealTotem78;
        ctx.beginPath();
        ctx.roundRect(sx-10, sy-18, 20, 36, 6);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = COLORS.white55;
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
        const glowCol = isSpecial ? COLORS.red100 : COLORS.gold100;
        const fillCol = isSpecial ? COLORS.red95 : COLORS.gold95;
        const strokeCol = isSpecial ? COLORS.redChestStroke55 : COLORS.white35;
        const stripeCol = isSpecial ? COLORS.pinkStripe55 : COLORS.white55;
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
          ctx.shadowColor = COLORS.greenHealGlow;
          ctx.shadowBlur = 14 * pulse;
          ctx.beginPath();
          ctx.fillStyle = COLORS.greenHealCore;
          ctx.arc(sx,sy,d.r * (0.95 + 0.12 * pulse),0,TAU);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.fillStyle = COLORS.blueBright90;
          ctx.arc(sx,sy,d.r,0,TAU);
          ctx.fill();
          ctx.beginPath();
          ctx.fillStyle = COLORS.white55;
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
          const headCol = b.color || COLORS.blueBright95;
          const tailCol = b.trailColor || COLORS.blueSoft75;
          const glowCol = b.glow || COLORS.blueGlowSoft70;
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
        const col = b.color || COLORS.pinkEnemyBullet90;
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
        ctx.fillStyle = COLORS.white90;
        ctx.beginPath();
        ctx.arc(sx,sy, player.auraRadius, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (player.aura && clones.length){
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = COLORS.blueSoft75;
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
        ctx.strokeStyle = COLORS.blueSoft90;
        ctx.shadowColor = COLORS.blueGlow55;
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
          ctx.fillStyle=COLORS.purpleNova35;
          ctx.moveTo(sx + px * w0, sy + py * w0);
          ctx.lineTo(sx - px * w0, sy - py * w0);
          ctx.lineTo(tx - px * w1, ty - py * w1);
          ctx.lineTo(tx + px * w1, ty + py * w1);
          ctx.closePath();
          ctx.fill();

          ctx.shadowColor = COLORS.purpleNova80;
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.fillStyle=COLORS.purpleNovaCore95;
          ctx.arc(sx,sy,b.r,0,TAU);
          ctx.fill();
          ctx.restore();
        } else {
          batchCirclePush(batch.bullets, sx, sy, b.r);
        }
      }
      batchCircleDraw(ctx, batch.bullets, COLORS.sandBullet95);

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
          ctx.fillStyle = COLORS.white85;
          ctx.fillRect(-d.r * 0.6, -d.r * 0.2, d.r * 1.2, d.r * 0.4);
          ctx.restore();
        }
      }

      // enemies
      for (const e of enemies){
        const sx=e.x-camX, sy=e.y-camY;
        let baseCol = e.type==="boss" ? COLORS.purpleBoss95 : COLORS.redEnemyBase92;
        if (e.type==="tank") baseCol=COLORS.red95;
        if (e.type==="runner") baseCol=COLORS.orangeRunner95;
        if (e.type==="shooter") baseCol=COLORS.tealShooter92;
        if (e.type==="bomber") baseCol=COLORS.goldBomber92;
        if (e.type==="triad") baseCol=COLORS.blueTriad95;
        if (e.type==="blaster") baseCol=COLORS.blueBlaster95;
        if (e.type==="burst") baseCol=COLORS.blueBurst95;
        if (e.type==="boss"){
          if (e.bossKind==="sniper") baseCol = COLORS.blueBright95;
          if (e.bossKind==="charger") baseCol = COLORS.orangeBossCharger95;
          if (e.bossKind==="spiral") baseCol = COLORS.purpleBossSpiral95;
          if (e.bossKind==="summoner") baseCol = COLORS.greenBossSummoner92;
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
          ctx.fillStyle = COLORS.blueTriad45;
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
          ctx.shadowColor = e.bulletGlow || COLORS.goldGlow95;
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
            ctx.fillStyle = COLORS.white95;
            ctx.arc(sx,sy,e.r,0,TAU);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.fillStyle = COLORS.white95;
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
          ctx.fillStyle = COLORS.white95;
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
            ctx.shadowColor = e.bulletGlow || COLORS.goldGlow95;
            ctx.shadowBlur = 26;
            ctx.fillStyle = e.bulletColor || COLORS.goldBullet98;
            const x0 = blasterFillFromBack ? -rr : (rr - fillW);
            ctx.fillRect(x0, -rr, fillW, rr * 2);
            ctx.restore();
          }
        }

        if (e.dying){
          const p = clamp(1 - (e.deathT / BURST_TELEGRAPH), 0, 1);
          ctx.globalAlpha = 0.9;
          ctx.lineWidth = 2 + p * 3;
          ctx.strokeStyle = COLORS.goldTelegraph95;
          ctx.beginPath();
          ctx.arc(sx,sy,e.r + 6 + p * 6,0,TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        if (e.elite){
          const pulse = 0.5 + 0.5 * Math.sin(state.t * 5 + e.id * 0.7);
          ctx.globalAlpha = 0.55 + pulse * 0.25;
          ctx.lineWidth = 3;
          ctx.strokeStyle = e.eliteColor || COLORS.goldElite90;
          ctx.beginPath();
          ctx.arc(sx,sy,e.r + 5 + pulse * 4,0,TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        if (e.type==="boss" || e.type==="tank"){
          ctx.globalAlpha=0.7;
          ctx.lineWidth=3;
          ctx.strokeStyle=COLORS.black35;
          ctx.beginPath();
          ctx.arc(sx,sy,e.r+3,0,TAU);
          ctx.stroke();

          const p = clamp(e.hp/e.hpMax,0,1);
          ctx.strokeStyle=COLORS.white65;
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
        ctx.fillStyle=COLORS.blueBright90;
        ctx.beginPath();
        ctx.roundRect(sx-hs, sy-hs, t.size, t.size, 5);
        ctx.fill();

        ctx.fillStyle=COLORS.white70;
        ctx.fillRect(sx-2, sy-hs-4, 4, 8);

        const p = clamp(t.hp/t.hpMax, 0, 1);
        ctx.strokeStyle=COLORS.white70;
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.arc(sx,sy, hs + 4, -Math.PI/2, -Math.PI/2 + TAU*p);
        ctx.stroke();
      }

      renderLightning(ctx, camX, camY);
      renderShockwaves(ctx, camX, camY);
      renderParticles(ctx, camX, camY);

      // orbitals
      if (player.orbitals>0){
        const orbSize = pF.getOrbitalSize();
        for(let k=0;k<player.orbitals;k++){
          const a = state.orbitalAngle + (k/Math.max(1,player.orbitals))*TAU;
          const ox = player.x + Math.cos(a)*player.orbitalRadius;
          const oy = player.y + Math.sin(a)*player.orbitalRadius;
          const sx=ox-camX, sy=oy-camY;
          batchCirclePush(batch.orbitals, sx, sy, orbSize);
        }
        batchCircleDraw(ctx, batch.orbitals, COLORS.bluePlayer95);
      }
      if (player.orbitals>0 && clones.length){
        const orbSize = pF.getOrbitalSize();
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
        batchCircleDraw(ctx, batch.orbitalsClone, COLORS.blueOrbitalClone70);
      }

      // magnet radius
      {
        const sx = player.x - camX;
        const sy = player.y - camY;

        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = COLORS.blueBright90;
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
          ctx.fillStyle = COLORS.blueSoft75;
          ctx.beginPath();
          ctx.arc(sx, sy, player.r * 0.95, 0, TAU);
          ctx.fill();
          ctx.globalAlpha = 0.8;
          ctx.strokeStyle = COLORS.blueSoft60;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }

      renderDashTrail(ctx, camX, camY);

      // player
      {
        const sx=player.x-camX, sy=player.y-camY;
        ctx.beginPath();
        const blink = player.invuln>0 && (Math.floor(performance.now()/60)%2===0);
        ctx.fillStyle = blink ? COLORS.white90 : COLORS.bluePlayer95;
        ctx.arc(sx,sy, player.r, 0, TAU);
        ctx.fill();
      }

      renderFloaters(ctx, camX, camY);

      // vignette
      const grd = ctx.createRadialGradient(w*0.5,h*0.5, Math.min(w,h)*0.15, w*0.5,h*0.5, Math.max(w,h)*0.75);
      const hpRatio = player.hpMax > 0 ? player.hp / player.hpMax : 1;
      const low = clamp((0.5 - hpRatio) / 0.5, 0, 1);
      let edgeColor = COLORS.black55;
      if (low > 0){
        const pulse = 0.6 + 0.4 * Math.sin(state.t * 6);
        const r = Math.round(255 + (200 - 255) * low);
        const g = Math.round(140 + (20 - 140) * low);
        const b = Math.round(60 + (20 - 60) * low);
        const alpha = (0.45 + 0.25 * low) * pulse;
        edgeColor = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
      }
      grd.addColorStop(0,COLORS.black0);
      grd.addColorStop(1, edgeColor);
      ctx.fillStyle=grd;
      ctx.fillRect(0,0,w,h);
    }

    // start
    menus.openMainMenu();
    startLoop(step);

  } catch (err) {
    crash(err);
  }

})();
