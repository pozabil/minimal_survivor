import { PLAYER_CLASSES } from "../content/players.js";
import { loadRecords } from "../systems/storage.js";
import { fmtTime } from "../utils/format.js";

export function createMenus({
  state,
  player,
  ui,
  overlays,
  updateBuildUI,
  applyOptionsToUI,
  handleSelectHero,
}) {
  const {
    mainMenuOverlay,
    startOverlay,
    pickerOverlay,
    gameoverOverlay,
    recordsOverlay,
    settingsOverlay,
    restartConfirmOverlay,
    pauseMenu,
    btnPause,
    charsWrap,
    summaryEl,
    recordsListEl,
    btnResume,
  } = overlays;

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

  function openMainMenu() {
    state.paused = true;
    mainMenuOverlay.style.display = "grid";
    updatePauseBtnVisibility();
  }

  function openStart() {
    state.paused = true;
    mainMenuOverlay.style.display = "none";
    startOverlay.style.display = "grid";
    updatePauseBtnVisibility();
    charsWrap.innerHTML = "";
    PLAYER_CLASSES.forEach((c) => {
      const div = document.createElement("div");
      div.className = "choice";
      div.innerHTML = `<div class="t">${c.name}</div><div class="d">${c.desc}</div><div class="d" style="margin-top:8px; opacity:.75">${c.perk}</div>`;
      div.addEventListener("click", () => {
        handleSelectHero(c);
        startOverlay.style.display = "none";
        state.paused = false;
        updatePauseBtnVisibility();
      });
      charsWrap.appendChild(div);
    });
  }

  let recordsReturnToPause = false;
  let recordsReturnToMenu = false;
  let settingsReturnToPause = false;
  let settingsReturnToMenu = false;
  let restartReturnToPause = false;
  let restartReturnToPlay = false;

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
    location.reload();
  }

  return {
    isPauseToggleBlocked,
    updatePauseBtnVisibility,
    openMainMenu,
    openStart,
    showRecords,
    hideRecords,
    showSettings,
    hideSettings,
    showRestartConfirm,
    hideRestartConfirm,
    togglePauseMenu,
    gameOver,
    resetGame,
  };
}
