import { GRID_SIZE } from "../core/constants.js";

const ALPHA_BASE = 0.02;
const ALPHA_PER_ENEMY = 0.02;
const ALPHA_MAX = 0.48;

export function renderSpatialGrid(ctx, camX, camY, cells) {
  ctx.save();
  ctx.lineWidth = 1;
  const strokeColor = "rgba(80, 240, 120, 0.45)";
  const textColor = "rgba(160, 255, 190, 0.9)";
  ctx.font = "14px system-ui,-apple-system,Segoe UI,Roboto,Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  for (const [key, cell] of cells) {
    const comma = key.indexOf(",");
    const cx = Number(key.slice(0, comma));
    const cy = Number(key.slice(comma + 1));
    const x = cx * GRID_SIZE - camX;
    const y = cy * GRID_SIZE - camY;
    const count = cell.length;
    const alpha = Math.min(ALPHA_MAX, ALPHA_BASE + count * ALPHA_PER_ENEMY);
    ctx.fillStyle = `rgba(80, 240, 120, ${alpha.toFixed(3)})`;
    ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
    ctx.strokeStyle = strokeColor;
    ctx.strokeRect(x, y, GRID_SIZE, GRID_SIZE);
    ctx.fillStyle = textColor;
    ctx.fillText(String(count), x + 2, y + 2);
  }
  ctx.restore();
}
