import { TAU } from "../../core/constants.js";
import { COLORS } from "../colors.js";

export function drawDogs({ ctx, dogs, camX, camY }) {
  if (!dogs.length) return;

  for (const d of dogs) {
    const sx = d.x - camX;
    const sy = d.y - camY;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(d.ang);
    ctx.beginPath();
    ctx.fillStyle = d.color;
    ctx.arc(0, 0, d.r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = COLORS.white85;
    ctx.fillRect(-d.r * 0.6, -d.r * 0.2, d.r * 1.2, d.r * 0.4);
    ctx.restore();
  }
}
