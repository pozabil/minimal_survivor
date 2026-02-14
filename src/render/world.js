import { COLORS } from "./colors.js";

export function renderWorldGrid(ctx, camX, camY, w, h) {
  const g = 52;
  const gx0 = Math.floor(camX / g) * g;
  const gy0 = Math.floor(camY / g) * g;

  ctx.globalAlpha = 0.40;
  ctx.strokeStyle = COLORS.white08;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = gx0; x < camX + w + g; x += g) {
    const sx = x - camX;
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, h);
  }
  for (let y = gy0; y < camY + h + g; y += g) {
    const sy = y - camY;
    ctx.moveTo(0, sy);
    ctx.lineTo(w, sy);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}
