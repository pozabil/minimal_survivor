import { JOY_HALF, JOY_MARGIN } from "../core/constants.js";
import { clamp, len2, len2Sq } from "../utils/math.js";

export function createInputSystem({
  canvas,
  joy,
  knob,
  isTouch,
  menus,
  pF,
  pickChoice,
  doReroll,
  overlays,
}) {
  const {
    pickerOverlay,
    startOverlay,
    mainMenuOverlay,
    gameoverOverlay,
    pauseMenu,
    recordsOverlay,
    settingsOverlay,
    restartConfirmOverlay,
  } = overlays;

  const keys = new Set();
  const joyVec = { x: 0, y: 0 };

  let actionHandler = null;
  let lastTapTime = 0;
  let lastTapX = 0;
  let lastTapY = 0;
  let joyActive = false;
  let joyPointerId = null;
  const joyCenter = { x: 0, y: 0 };
  const joyRadius = 70;

  const overlaysBlockInput = () =>
    (pickerOverlay.style.display === "grid") ||
    (startOverlay.style.display === "grid") ||
    (mainMenuOverlay.style.display === "grid") ||
    (gameoverOverlay.style.display === "grid") ||
    (pauseMenu.style.display === "grid") ||
    (recordsOverlay.style.display === "grid") ||
    (settingsOverlay.style.display === "grid") ||
    (restartConfirmOverlay.style.display === "grid");

  function triggerAction() {
    actionHandler();
  }

  function placeJoystick(cx, cy) {
    const x = clamp(cx, JOY_HALF + JOY_MARGIN, innerWidth - JOY_HALF - JOY_MARGIN);
    const y = clamp(cy, JOY_HALF + JOY_MARGIN, innerHeight - JOY_HALF - JOY_MARGIN);
    joy.style.left = `${x}px`;
    joy.style.top = `${y}px`;
  }

  function joyMove(px, py) {
    const dx = px - joyCenter.x;
    const dy = py - joyCenter.y;
    const d = len2(dx, dy) || 1;
    const m = Math.min(1, d / joyRadius);
    joyVec.x = (dx / d) * m;
    joyVec.y = (dy / d) * m;

    const ox = joyVec.x * (joyRadius * 0.70);
    const oy = joyVec.y * (joyRadius * 0.70);
    knob.style.transform = `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px))`;
  }

  function joyReset() {
    joyActive = false;
    joyPointerId = null;
    joyVec.x = 0;
    joyVec.y = 0;
    knob.style.transform = "translate(-50%, -50%)";
    joy.style.display = "none";
  }

  window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();

    if (e.code === "Escape") {
      if (restartConfirmOverlay.style.display === "grid") {
        menus.hideRestartConfirm();
        return;
      }
      if (settingsOverlay.style.display === "grid") {
        menus.hideSettings();
        return;
      }
      if (recordsOverlay.style.display === "grid") {
        menus.hideRecords();
        return;
      }
      if (
        pickerOverlay.style.display === "grid" ||
        startOverlay.style.display === "grid" ||
        mainMenuOverlay.style.display === "grid" ||
        gameoverOverlay.style.display === "grid" ||
        restartConfirmOverlay.style.display === "grid"
      ) return;
      menus.togglePauseMenu();
      return;
    }

    if (pickerOverlay.style.display === "grid") {
      if (e.key === "1") pickChoice(0);
      if (e.key === "2") pickChoice(1);
      if (e.key === "3") pickChoice(2);
      if (e.key.toLowerCase() === "r") doReroll();
    }

    if (e.code === "Space") {
      if (
        pickerOverlay.style.display === "grid" ||
        startOverlay.style.display === "grid" ||
        mainMenuOverlay.style.display === "grid" ||
        gameoverOverlay.style.display === "grid" ||
        pauseMenu.style.display === "grid" ||
        restartConfirmOverlay.style.display === "grid"
      ) return;
      triggerAction();
    }

    keys.add(e.code);
  }, { passive: false });

  window.addEventListener("keyup", (e) => keys.delete(e.code), { passive: true });

  if (isTouch) {
    canvas.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
      if (overlaysBlockInput()) return;
      if (e.target instanceof Element && e.target.closest("#btnPause")) return;

      if (pF.hasAnyActionSkill()) {
        const now = performance.now();
        const dtTap = now - lastTapTime;
        const dx = e.clientX - lastTapX;
        const dy = e.clientY - lastTapY;
        const distSq = len2Sq(dx, dy);
        if (dtTap < 280 && distSq < 40 * 40) {
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
      joyCenter.x = e.clientX;
      joyCenter.y = e.clientY;
      placeJoystick(e.clientX, e.clientY);
      joy.style.display = "block";
      joyActive = true;
      joyMove(e.clientX, e.clientY);
    }, { passive: true });

    canvas.addEventListener("pointermove", (e) => {
      if (!joyActive || joyPointerId !== e.pointerId) return;
      joyMove(e.clientX, e.clientY);
    }, { passive: true });

    canvas.addEventListener("pointerup", (e) => {
      if (joyPointerId !== e.pointerId) return;
      joyReset();
    }, { passive: true });

    canvas.addEventListener("pointercancel", (e) => {
      if (joyPointerId !== e.pointerId) return;
      joyReset();
    }, { passive: true });
  }

  function setActionHandler(nextActionHandler) {
    actionHandler = nextActionHandler;
  }

  return {
    keys,
    joyVec,
    setActionHandler,
  };
}
