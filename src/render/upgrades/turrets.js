import { TAU } from "../../core/constants.js";
import { clamp } from "../../utils/math.js";
import { COLORS } from "../colors.js";

export function renderTurrets({ ctx, turrets, camX, camY }) {
  for (const t of turrets) {
    const sx = t.x - camX;
    const sy = t.y - camY;
    const hs = t.size * 0.5;
    ctx.fillStyle = COLORS.blueBright90;
    ctx.beginPath();
    ctx.roundRect(sx - hs, sy - hs, t.size, t.size, 5);
    ctx.fill();

    ctx.fillStyle = COLORS.white70;
    ctx.fillRect(sx - 2, sy - hs - 4, 4, 8);

    const p = clamp(t.hp / t.hpMax, 0, 1);
    ctx.strokeStyle = COLORS.white70;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sx, sy, hs + 4, -Math.PI / 2, -Math.PI / 2 + TAU * p);
    ctx.stroke();
  }
}
