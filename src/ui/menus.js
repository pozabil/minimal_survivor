import { PLAYER_CLASSES } from "../content/players.js";
import { LEVELS } from "../content/levels.js";
import { loadProgression, loadRecords } from "../systems/storage.js";
import { fmtTime } from "../utils/format.js";

export function createMenus({
  state,
  player,
  ui,
  overlays,
  updateBuildUI,
  applyOptionsToUI,
}) {
  const {
    mainMenuOverlay,
    menuSubtitle,
    btnMenuProgress,
    btnFreePlay,
    btnMenuRecords,
    btnMenuSettings,
    levelSelectOverlay,
    levelsWrap,
    btnLevelsBack,
    startOverlay,
    pickerOverlay,
    gameoverOverlay,
    recordsOverlay,
    btnRecords,
    btnRecordsOver,
    btnRecordsClose,
    settingsOverlay,
    btnSettings,
    btnSettingsClose,
    restartConfirmOverlay,
    btnRestart2,
    btnRestartYes,
    btnRestartNo,
    restartBtn,
    btnShowBuild,
    pauseMenu,
    btnPause,
    charsWrap,
    summaryEl,
    recordsListEl,
    btnResume,
  } = overlays;
  const baseMenuSubtitle = menuSubtitle ? menuSubtitle.textContent : "Главное меню";

  let recordsReturnToPause = false;
  let recordsReturnToMenu = false;
  let settingsReturnToPause = false;
  let settingsReturnToMenu = false;
  let restartReturnToPause = false;
  let restartReturnToPlay = false;
  let runHandlers = { startRun() {}, handleResetGame() {} };

  function setRunHandlers(nextRunHandlers) {
    runHandlers = nextRunHandlers;
  }

  const isPauseToggleBlocked = () =>
    (pickerOverlay.style.display === "grid") ||
    (levelSelectOverlay.style.display === "grid") ||
    (startOverlay.style.display === "grid") ||
    (mainMenuOverlay.style.display === "grid") ||
    (gameoverOverlay.style.display === "grid") ||
    (recordsOverlay.style.display === "grid") ||
    (settingsOverlay.style.display === "grid") ||
    (restartConfirmOverlay.style.display === "grid");

  const updatePauseBtnVisibility = () => {
    btnPause.style.display = isPauseToggleBlocked() ? "none" : "block";
  };

  function resetTransientFlags() {
    recordsReturnToPause = false;
    recordsReturnToMenu = false;
    settingsReturnToPause = false;
    settingsReturnToMenu = false;
    restartReturnToPause = false;
    restartReturnToPlay = false;
  }

  function hideAllOverlays() {
    mainMenuOverlay.style.display = "none";
    levelSelectOverlay.style.display = "none";
    pauseMenu.style.display = "none";
    startOverlay.style.display = "none";
    pickerOverlay.style.display = "none";
    gameoverOverlay.style.display = "none";
    recordsOverlay.style.display = "none";
    settingsOverlay.style.display = "none";
    restartConfirmOverlay.style.display = "none";
  }

  function enterMainMenuUi() {
    resetTransientFlags();
    hideAllOverlays();
    state.paused = true;
    mainMenuOverlay.style.display = "grid";
    setMainMenuNotice();
    updatePauseBtnVisibility();
  }

  function enterGameplayUi() {
    resetTransientFlags();
    hideAllOverlays();
    startOverlay.style.display = "none";
    state.paused = false;
    updatePauseBtnVisibility();
  }

  function openLevel(levelId) {
    resetTransientFlags();
    hideAllOverlays();
    state.paused = true;
    startOverlay.style.display = "grid";
    updatePauseBtnVisibility();
    charsWrap.innerHTML = "";
    PLAYER_CLASSES.forEach((c) => {
      const div = document.createElement("div");
      div.className = "choice";
      div.innerHTML = `<div class="t">${c.name}</div><div class="d">${c.desc}</div><div class="d" style="margin-top:8px; opacity:.75">${c.perk}</div>`;
      div.addEventListener("click", () => {
        runHandlers.startRun(levelId, c);
      });
      charsWrap.appendChild(div);
    });
  }

  function openProgressionLevels() {
    resetTransientFlags();
    hideAllOverlays();
    state.paused = true;
    levelSelectOverlay.style.display = "grid";
    updatePauseBtnVisibility();
    levelsWrap.innerHTML = "";

    const completedLevels = new Set(loadProgression().completedLevels);
    LEVELS.forEach((level, index) => {
      const prev = LEVELS[index - 1];
      const unlocked = index === 0 || completedLevels.has(prev.id);
      const completed = completedLevels.has(level.id);

      const div = document.createElement("div");
      div.className = `choice${unlocked ? "" : " disabled"}`;
      const stateText = completed ? "Пройден" : (unlocked ? "Открыт" : "Закрыт");
      div.innerHTML = `
        <div class="t">${level.name}</div>
        <div class="d">${level.objectiveText}</div>
        <div class="d" style="margin-top:8px; opacity:.75">Статус: ${stateText}</div>
      `;
      if (unlocked) {
        div.addEventListener("click", () => openLevel(level.id));
      }
      levelsWrap.appendChild(div);
    });
  }

  function setMainMenuNotice(text = "") {
    if (!menuSubtitle) return;
    menuSubtitle.textContent = text || baseMenuSubtitle;
  }

  function renderRecords() {
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

  function showRecords() {
    recordsReturnToPause = pauseMenu.style.display === "grid";
    recordsReturnToMenu = mainMenuOverlay.style.display === "grid";
    if (recordsReturnToPause) pauseMenu.style.display = "none";
    if (recordsReturnToMenu) mainMenuOverlay.style.display = "none";
    renderRecords();
    recordsOverlay.style.display = "grid";
    updatePauseBtnVisibility();
  }

  function hideRecords() {
    recordsOverlay.style.display = "none";
    if (recordsReturnToPause) {
      pauseMenu.style.display = "grid";
    } else if (recordsReturnToMenu) {
      mainMenuOverlay.style.display = "grid";
    }
    recordsReturnToPause = false;
    recordsReturnToMenu = false;
    updatePauseBtnVisibility();
  }

  function showSettings() {
    settingsReturnToPause = pauseMenu.style.display === "grid";
    settingsReturnToMenu = mainMenuOverlay.style.display === "grid";
    if (settingsReturnToPause) pauseMenu.style.display = "none";
    if (settingsReturnToMenu) mainMenuOverlay.style.display = "none";
    applyOptionsToUI();
    settingsOverlay.style.display = "grid";
    updatePauseBtnVisibility();
  }

  function hideSettings() {
    settingsOverlay.style.display = "none";
    if (settingsReturnToPause) {
      pauseMenu.style.display = "grid";
    } else if (settingsReturnToMenu) {
      mainMenuOverlay.style.display = "grid";
    }
    settingsReturnToPause = false;
    settingsReturnToMenu = false;
    updatePauseBtnVisibility();
  }

  function showRestartConfirm() {
    if (restartConfirmOverlay.style.display === "grid") return;
    restartReturnToPause = pauseMenu.style.display === "grid";
    restartReturnToPlay = !state.paused;
    if (restartReturnToPause) pauseMenu.style.display = "none";
    state.paused = true;
    restartConfirmOverlay.style.display = "grid";
    updatePauseBtnVisibility();
  }

  function hideRestartConfirm() {
    restartConfirmOverlay.style.display = "none";
    if (restartReturnToPause) {
      pauseMenu.style.display = "grid";
    } else if (restartReturnToPlay) {
      state.paused = false;
    }
    restartReturnToPause = false;
    restartReturnToPlay = false;
    updatePauseBtnVisibility();
  }

  function togglePauseMenu() {
    if (state.dead) return;
    if (restartConfirmOverlay.style.display === "grid") return;
    state.paused = !state.paused;
    if (state.paused) {
      ui.buildFromPicker = false;
      btnResume.textContent = "Resume";
      updateBuildUI();
      pauseMenu.style.display = "grid";
    } else pauseMenu.style.display = "none";
  }

  function gameOver() {
    state.paused = true;
    pickerOverlay.style.display = "none";
    pauseMenu.style.display = "none";
    gameoverOverlay.style.display = "grid";
    summaryEl.textContent = `Time: ${fmtTime(state.t)} · Hero: ${player.heroName} · Level: ${player.lvl} · Kills: ${state.kills} · Damage: ${Math.round(state.dmgDone)}${state.deathReason ? ` · Cause: ${state.deathReason}` : ""}`;
    updatePauseBtnVisibility();
  }

  function resetGame() {
    if (!state.dead) {
      showRestartConfirm();
      return;
    }
    runHandlers.handleResetGame();
  }

  btnFreePlay.addEventListener("click", ()=>openLevel("freeGame"));
  btnMenuProgress.addEventListener("click", ()=>openProgressionLevels());
  btnMenuRecords.addEventListener("click", ()=>showRecords());
  btnMenuSettings.addEventListener("click", ()=>showSettings());
  btnLevelsBack.addEventListener("click", ()=>enterMainMenuUi());
  btnSettings.addEventListener("click", ()=>showSettings());
  btnSettingsClose.addEventListener("click", hideSettings);

  btnPause.addEventListener("click", (e)=>{
    e.preventDefault();
    if (isPauseToggleBlocked()) return;
    togglePauseMenu();
  });

  btnResume.addEventListener("click", ()=>{
    if (ui.buildFromPicker && pickerOverlay.style.display === "grid"){
      pauseMenu.style.display = "none";
      return; // keep paused, picker remains
    }
    pauseMenu.style.display = "none";
    state.paused = false;
  });

  btnShowBuild.addEventListener("click", ()=>{
    ui.buildFromPicker = (pickerOverlay.style.display === "grid");
    btnResume.textContent = ui.buildFromPicker ? "Back to picker" : "Resume";
    updateBuildUI();
    pauseMenu.style.display = "grid";
  });

  btnRestart2.addEventListener("click", ()=>resetGame());
  btnRestartYes.addEventListener("click", ()=>runHandlers.handleResetGame());
  btnRestartNo.addEventListener("click", hideRestartConfirm);
  restartBtn.addEventListener("click", ()=>resetGame());

  btnRecords.addEventListener("click", ()=>showRecords());
  btnRecordsOver.addEventListener("click", ()=>showRecords());
  btnRecordsClose.addEventListener("click", ()=>hideRecords());

  return {
    setRunHandlers,
    enterMainMenuUi,
    enterGameplayUi,
    setMainMenuNotice,
    resetTransientFlags,
    hideRecords,
    hideSettings,
    hideRestartConfirm,
    togglePauseMenu,
    gameOver,
  };
}
