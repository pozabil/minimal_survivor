import { TAU } from "../core/constants.js";
import { COLORS } from "./colors.js";

export function drawDrops({ ctx, drops, camX, camY, t }) {
  for (const d of drops) {
    const sx = d.x - camX;
    const sy = d.y - camY;
    if (d.kind === "heal") {
      const pulse = 0.6 + 0.4 * Math.sin((d.pulse || 0) + t * 6);
      ctx.save();
      ctx.shadowColor = COLORS.greenHealGlow;
      ctx.shadowBlur = 14 * pulse;
      ctx.beginPath();
      ctx.fillStyle = COLORS.greenHealCore;
      ctx.arc(sx, sy, d.r * (0.95 + 0.12 * pulse), 0, TAU);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.fillStyle = COLORS.blueBright90;
      ctx.arc(sx, sy, d.r, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = COLORS.white55;
      ctx.arc(sx - 2, sy - 2, 2, 0, TAU);
      ctx.fill();
    }
  }
}
