import { AURA_WAVE_THICKNESS } from "../../content/upgrades.js";
import { TAU } from "../../core/constants.js";
import { clamp } from "../../utils/math.js";
import { COLORS } from "../colors.js";

export function drawAura({ ctx, player, clones, state, camX, camY }) {
  if (player.aura) {
    const sx = player.x - camX;
    const sy = player.y - camY;
    ctx.globalAlpha = 0.10;
    ctx.fillStyle = COLORS.white90;
    ctx.beginPath();
    ctx.arc(sx, sy, player.auraRadius, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (player.aura && clones.length) {
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = COLORS.blueSoft75;
    for (const sc of clones) {
      const sx = sc.x - camX;
      const sy = sc.y - camY;
      ctx.beginPath();
      ctx.arc(sx, sy, player.auraRadius, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  if (state.auraWaveActive) {
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
}
