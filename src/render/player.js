import { TAU } from "../core/constants.js";
import { COLORS } from "./colors.js";

export function renderMagnetRadius({ ctx, player, camX, camY }) {
  const sx = player.x - camX;
  const sy = player.y - camY;

  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = COLORS.blueBright90;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sx, sy, player.magnet, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function renderPlayer({ ctx, player, camX, camY }) {
  const sx = player.x - camX;
  const sy = player.y - camY;
  ctx.beginPath();
  const blink = player.invuln > 0 && (Math.floor(performance.now() / 60) % 2 === 0);
  ctx.fillStyle = blink ? COLORS.white90 : COLORS.bluePlayer95;
  ctx.arc(sx, sy, player.r, 0, TAU);
  ctx.fill();
}
