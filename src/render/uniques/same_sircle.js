import { TAU } from "../../core/constants.js";
import { clamp } from "../../utils/math.js";
import { COLORS } from "../colors.js";

export function renderSameCircle({ ctx, clones, player, camX, camY }) {
  for (const sc of clones) {
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
