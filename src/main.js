import { initCanvas } from "./core/canvas.js";
import { createUpgrades } from "./content/upgrades.js";
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

import { createRenderBatch, ensureRoundRectPolyfill } from "./systems/render.js";
import { setupCameraAndFrame } from "./render/base.js";
import { renderWorldGrid } from "./render/world.js";
import { renderTotem } from "./render/totem.js";
import { renderChests } from "./render/chests.js";
import { renderDrops } from "./render/drops.js";
import { renderEnemies } from "./render/enemies.js";
import { renderBullets, renderEnemyBullets } from "./render/projectiles.js";
import { renderMagnetRadius, renderPlayer } from "./render/player.js";
import { renderAura } from "./render/upgrades/aura.js";
import { renderOrbitals } from "./render/upgrades/orbitals.js";
import { renderSameCircle } from "./render/uniques/same_sircle.js";
import { renderTurrets } from "./render/upgrades/turrets.js";
import { renderDogs } from "./render/uniques/dog.js";
import { renderVignette } from "./render/ui/vignette.js";
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
      state, player, spawn, enemies, enemyBullets, spawnEnemy, maxShirt, spawnBurst, spawnHealFloat, dropXp, dropHeal, elBossWrap,
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
      enemies, turrets, player, state, pF, enemyCombatSystem, getEnemyTarget, spawnColossusElite, applyDamageToPlayer, handlePlayerDeath, formatDeathReason, spawnBurst, killEnemy, pruneDeadEnemies,
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

      if (player.regen > 0 && player.hp > 0){
        player.hp = Math.min(player.hpMax, player.hp + player.regen*dt);
      }
      updateHeal(dt);
      player.invuln = Math.max(0, player.invuln - dt);
      maxShirt.updateMaxShirt(dt);

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

      updateEnemies(dt, dampFast, lerpFast);
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

      renderWorldGrid(ctx, camX, camY, w, h);

      // debug
      // renderSpatialGrid(ctx, camX, camY, getGridCells());

      renderTotem({ ctx, totem, player, camX, camY, w, h });
      renderChests({ ctx, chests, player, camX, camY, w, h });
      renderDrops({ ctx, drops, camX, camY, t: state.t });
      renderEnemyBullets({ ctx, enemyBullets, camX, camY, batchEnemyBullets: batch.enemyBullets });
      renderAura({ ctx, player, clones, state, camX, camY });
      renderBullets({ ctx, bullets, camX, camY, batchBullets: batch.bullets });
      renderDogs({ ctx, dogs, camX, camY });
      renderEnemies({ ctx, enemies, state, camX, camY });
      renderTurrets({ ctx, turrets, camX, camY });
      renderLightning(ctx, camX, camY);
      renderShockwaves(ctx, camX, camY);
      renderParticles(ctx, camX, camY);
      renderOrbitals({ ctx, player, clones, state, camX, camY, pF, batch });
      renderMagnetRadius({ ctx, player, camX, camY });
      renderSameCircle({ ctx, clones, player, camX, camY });
      renderDashTrail(ctx, camX, camY);
      renderPlayer({ ctx, player, camX, camY });
      renderFloaters(ctx, camX, camY);
      renderVignette({ ctx, w, h, player, t: state.t });
    }
    // RENDER

    // START
    menus.openMainMenu();
    startLoop(step);

  } catch (err) {
    crash(err);
  }

})();
