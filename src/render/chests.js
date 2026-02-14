import { TAU } from "../core/constants.js";
import { COLORS } from "./colors.js";
import { renderOffscreenArrow } from "./ui/arrows.js";

export function drawChests({ ctx, chests, player, camX, camY, w, h }) {
  if (!chests.length) return;

  const c = chests[0];
  const sx = c.x - camX;
  const sy = c.y - camY;
  const bob = Math.sin(c.t * 3 + c.bob) * 3;
  const isSpecial = !!c.special;
  const glowCol = isSpecial ? COLORS.red100 : COLORS.gold100;
  const fillCol = isSpecial ? COLORS.red95 : COLORS.gold95;
  const strokeCol = isSpecial ? COLORS.redChestStroke55 : COLORS.white35;
  const stripeCol = isSpecial ? COLORS.pinkStripe55 : COLORS.white55;
  const chestW = c.r * 2.25;
  const chestH = c.r * 1.625;
  const chestR = Math.max(5, c.r * 0.45);
  const glowR = c.r * 1.25;

  ctx.globalAlpha = 0.15;
  ctx.fillStyle = glowCol;
  ctx.beginPath();
  ctx.arc(sx, sy + 10, glowR, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = fillCol;
  ctx.beginPath();
  ctx.roundRect(sx - chestW * 0.5, sy - chestH * 0.5 + bob, chestW, chestH, chestR);
  ctx.fill();
  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = stripeCol;
  ctx.fillRect(sx - 2, sy - chestH * 0.5 + bob, 4, chestH);

  // Direction arrow to chest (when it's off-screen).
  renderOffscreenArrow(ctx, camX, camY, w, h, player.x, player.y, c.x, c.y, isSpecial ? "specialChest" : "chest");
}
