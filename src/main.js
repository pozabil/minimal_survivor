import { BURST_TELEGRAPH } from "./content/enemies.js";
import { TAU } from "./core/constants.js";
import { initCanvas } from "./core/canvas.js";
import { clamp, len2 } from "./utils/math.js";
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
import { createUpdateCamera } from "./systems/camera.js";
import { createRicochetHelpers, createShootingSystem, createDamageTracker, createPlayerDamageApplier } from "./systems/combat.js";
import { createUpdateDogs } from "./systems/uniques/dog.js";
import { createDashSystem } from "./systems/uniques/dash.js";
import { createMaxShirtSystem } from "./systems/uniques/max_shirt.js";
import { createTryConsumeSpareTire } from "./systems/uniques/spare_tire.js";
import { createAuraSystem } from "./systems/upgrades/aura.js";
import { createTurretSystem } from "./systems/upgrades/turrets.js";
import { createUpdateSameCircle } from "./systems/uniques/same_circle.js";
import { createUpdatePatriarchDoll } from "./systems/patriarch_doll.js";
import { createUpdateBullets, createUpdateEnemyBullets } from "./systems/projectiles.js";
import { createUpdateTotem } from "./systems/totem.js";
import { createSpawnDrops, createUpdateDrops } from "./systems/drops.js";
import { createProgressionSystem, createTryPickupChest } from "./systems/progression.js";
import { createOrbitalsSystem } from "./systems/upgrades/orbitals.js";
import { createEnemyCombatSystem } from "./systems/enemies/combat.js";
import { createEnemyDeathSystem } from "./systems/enemies/death.js";
import { createUpdateEnemies } from "./systems/enemies/updates.js";

import { createRenderBatch, batchCirclePush, batchCircleDraw, batchMapPush, ensureRoundRectPolyfill } from "./systems/render.js";
import { setupCameraAndFrame } from "./render/base.js";
import { drawWorldGrid } from "./render/world.js";
import { drawTotem } from "./render/totem.js";
import { drawChests } from "./render/chests.js";
import { COLORS } from "./render/colors.js";
import { createEffectRenderer } from "./render/effects/render.js";
import { createSpawnBoss, createSpawnChest, createSpawnColossusElite, createSpawnEnemy, createSpawnTotem, createSpawnTurret, createSpawnDog, updateSpawning } from "./systems/spawning.js";
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
    const { elBossWrap } = hud;
    const overlays = initOverlays();
    const { pauseMenu, btnHang } = overlays;

    const profiler = createProfilerUI();

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

    const batch = createRenderBatch();
    ensureRoundRectPolyfill();

    const { player, state, ui, entities, spawn, effects } = initState();
    const { bullets, enemyBullets, enemies, turrets, drops, clones, dogs, chests, totem } = entities;
    const { particles, shockwaves, lightningStrikes, floaters, dashTrail } = effects;

    const { spawnBurst, spawnShockwave, spawnDashTrail, spawnLightningStrike, spawnHealFloat, spawnDamageFloat } = createEffectSpawns({
      player, particles, shockwaves, lightningStrikes, floaters, dashTrail,
    });
    const { updateDashTrail, updateLightning, updateParticles, updateShockwaves, updateFloaters } = createEffectUpdates({
      state, dashTrail, lightningStrikes, particles, shockwaves, floaters,
    });
    const { renderLightning, renderShockwaves, renderParticles, renderDashTrail, renderFloaters } = createEffectRenderer({
      particles, shockwaves, lightningStrikes, floaters, dashTrail,
    });

    const { gridBuild, gridQueryCircle, getGridCells } = createSpatialGrid(enemies);
    const targeting = createTargeting({ enemies, gridQueryCircle });
    const ricochetHelpers = createRicochetHelpers({ bullets, targeting });

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

    const { updateUI, forceUpdateRerollsUI, forceUpdatePlayerHpBar } = createUpdateUi({
      hud, overlays, player, state, entities, spawn, pF, getDps, isTouch, uniques: UNIQUES,
    });

    const updateBuildUI = createBuildUI({ overlays, player, state, ui, pF, UNIQUES, UPGRADES, getDps });

    const { openUpgradePicker, maybeOpenLevelPicker, pickChoice, doReroll } = createUpgradePicker({
      state, ui, player, pF, UPGRADES, UNIQUES, overlays, updateBuildUI, forceUpdateRerollsUI,
    });

    // SELECT HERO
    function maybeAddStartingDog(heroId){
      const hero = getPlayerClass(heroId);
      const chance = hero ? (hero.dogStartChance || 0) : 0;
      if (chance > 0 && Math.random() < chance) pF.addUniqueItem("dog");
    }

    function handleSelectHero(hero){
      hero.apply(player);
      maybeAddStartingDog(hero.id);
    }
    // SELECT HERO

    const menus = createMenus({ state, player, ui, overlays, updateBuildUI, applyOptionsToUI, handleSelectHero });
    bindMiscUI({ overlays, player, state });

    const input = createInputSystem({ canvas, joy, knob, isTouch, menus, pF, pickChoice, doReroll, overlays });
    const { keys, joyVec } = input;

    const updateMovement = createUpdateMovement({ keys, isTouch, joyVec, player, state, turrets });

    const triggerDash = createDashSystem({ player, state, pF, keys, isTouch, joyVec, spawnDashTrail });
    const maxShirt = createMaxShirtSystem({ state, pF });

    // ACTIVE ITEMS
    input.setActionHandler(()=>{
      if (state.paused || state.dead) return;
      maxShirt.tryActivateMaxShirt();
      triggerDash();
    });
    // ACTIVE ITEMS

    const { dropXp, dropHeal } = createSpawnDrops({ drops });
    const { gainXp, queueHeal, updateHeal } = createProgressionSystem({ player, state, pF, maybeOpenLevelPicker });

    const tryConsumeSpareTire = createTryConsumeSpareTire({ pF, player, spawnBurst, pauseMenu, updateBuildUI });
    const { formatDeathReason, handlePlayerDeath } = createDeathHelpers({ state, player, menus, forceUpdatePlayerHpBar, tryConsumeSpareTire });

    const spawnEnemy = createSpawnEnemy({ player, state, enemies, spawnScale: SPAWN_SCALE });
    const spawnBoss = createSpawnBoss({ spawn, spawnEnemy, elBossWrap });
    const spawnColossusElite = createSpawnColossusElite({ player, state, spawnEnemy, });

    const spawnChest = createSpawnChest({ state, chests, totem, player, pF });
    const tryPickupChest = createTryPickupChest({ chests, player, state, openUpgradePicker });

    const spawnTotem = createSpawnTotem({ player, totem, pF });

    const spawnTurret = createSpawnTurret({ player, turrets, pF, });

    const shooting = createShootingSystem({ player, bullets, pF, targeting, spawnTurret });

    const { getEnemyTarget, updateTurrets } = createTurretSystem({ player, pF, turrets, shooting });
    const { killEnemy, pruneDeadEnemies } = createEnemyDeathSystem({
      state,
      player,
      spawn,
      enemies,
      enemyBullets,
      spawnEnemy,
      maxShirt,
      spawnBurst,
      spawnHealFloat,
      dropXp,
      dropHeal,
      elBossWrap,
    });
    const { updateOrbitalsFor, updateOrbitals } = createOrbitalsSystem({ player, state, pF, gridQueryCircle, recordDamage, killEnemy });
    const { applyAuraFor, applyAura } = createAuraSystem({ state, player, pF, gridQueryCircle, recordDamage, killEnemy });

    const updateSameCircle = createUpdateSameCircle({
      pF, state, clones, player, enemies, shooting, updateOrbitalsFor, applyAuraFor, recordDamage, killEnemy, spawnBurst, spawnShockwave,
    });

    const enemyCombatSystem = createEnemyCombatSystem({
      enemyBullets, enemies, turrets, player, pF, spawnBurst, applyDamageToPlayer, handlePlayerDeath, killEnemy,
    });
    const updateEnemies = createUpdateEnemies({
      enemies,
      turrets,
      player,
      state,
      pF,
      enemyCombatSystem,
      getEnemyTarget,
      spawnColossusElite,
      applyDamageToPlayer,
      handlePlayerDeath,
      formatDeathReason,
      spawnBurst,
      killEnemy,
      pruneDeadEnemies,
    });

    btnHang.addEventListener("click", ()=>{
      if (!pF.hasUnique("rope")) return;
      handlePlayerDeath("(он все таки смог)");
    });

    const step = createStep({ state, player, entities, profiler, update, realtimeUpdate, render });

    const updateDogs = createUpdateDogs({ player, dogs, pF, gridQueryCircle, recordDamage, killEnemy });
    const updatePatriarchDoll = createUpdatePatriarchDoll({
      pF, state, player, enemies, spawnLightningStrike, recordDamage, spawnBurst, killEnemy,
    });
    const updateBullets = createUpdateBullets({ bullets, player, pF, gridQueryCircle, ricochetHelpers, killEnemy, recordDamage });
    const updateEnemyBullets = createUpdateEnemyBullets({
      enemyBullets, turrets, player, pF, spawnBurst, applyDamageToPlayer, handlePlayerDeath, formatDeathReason,
    });
    const updateTotem = createUpdateTotem({ totem, player, pF, applyDamageToPlayer, handlePlayerDeath });
    const updateDrops = createUpdateDrops({ drops, player, bullets, turrets, pF, queueHeal, gainXp });
    const updateCamera = createUpdateCamera({ player, pF, gameScale: GAME_SCALE });

    // UPDATE
    function update(dt){
      state.t += dt;

      const dampFast = Math.pow(0.001, dt);
      const dampSlow = Math.pow(0.02, dt);
      const lerpFast = 1 - dampFast;

      updateSpawning({ dt, state, player, spawn, chests, totem, spawnBoss, spawnChest, spawnTotem, spawnEnemy, pF });

      const moveSpeed = pF.getMoveSpeed();
      updateMovement({ dt, lerpFast, moveSpeed });

      cameraScale = updateCamera({ cameraScale, lerpFast, moveSpeed });

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

      tryPickupChest(dt);

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

      updateBullets(dt);

      updateEnemyBullets(dt);
      if (state.dead) return;

      updateEnemies(dt, dampFast);
      if (state.dead) return;

      // XP drops update + pickup
      updateDrops(dt, dampFast);

      updateParticles(dt, dampSlow);
      updateShockwaves(dt);
      updateFloaters(dt, dampSlow);
    }
    // UPDATE

    // REALTIME UPDATE
    function realtimeUpdate(dtRaw){
      updateUI(dtRaw);
    }
    // REALTIME UPDATE

    // RENDER
    function render(){
      const { w, h, camX, camY } = setupCameraAndFrame({ ctx, getDpr, cameraScale, player, batch });

      drawWorldGrid(ctx, camX, camY, w, h);

      // debug
      // renderSpatialGrid(ctx, camX, camY, getGridCells());

      drawTotem({ ctx, totem, player, camX, camY, w, h });
      drawChests({ ctx, chests, player, camX, camY, w, h });

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
          ctx.fillStyle = d.color
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
    // RENDER

    // START
    menus.openMainMenu();
    startLoop(step);

  } catch (err) {
    crash(err);
  }

})();
