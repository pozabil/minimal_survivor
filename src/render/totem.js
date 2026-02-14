import { TAU } from "../core/constants.js";
import { COLORS } from "./colors.js";
import { renderOffscreenArrow } from "./ui/arrows.js";

export function renderTotem({ ctx, totem, player, camX, camY, w, h }) {
  if (!totem.active) return;

  const sx = totem.x - camX;
  const sy = totem.y - camY;
  const pulse = 0.5 + 0.5 * Math.sin(totem.t * 2.6);
  const inner = totem.r * (0.15 + 0.55 * pulse);
  const grad = ctx.createRadialGradient(sx, sy, inner, sx, sy, totem.r);
  grad.addColorStop(0, COLORS.tealTotem0);
  grad.addColorStop(0.55, `rgba(${COLORS.tealTotemRgb},${0.05 + 0.06 * pulse})`);
  grad.addColorStop(1, `rgba(${COLORS.tealTotemRgb},${0.12 + 0.12 * pulse})`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(sx, sy, totem.r, 0, TAU);
  ctx.fill();

  const lifeLeft = Math.max(0, Math.ceil(totem.life));
  const fontSize = Math.max(32, totem.r * 0.75);
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = COLORS.mintText38;
  ctx.strokeStyle = COLORS.black25;
  ctx.lineWidth = Math.max(2, fontSize * 0.03);
  ctx.font = `900 ${fontSize}px system-ui,-apple-system,Segoe UI,Roboto,Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(String(lifeLeft), sx, sy);
  ctx.fillText(String(lifeLeft), sx, sy);
  ctx.restore();

  ctx.globalAlpha = 0.55 + 0.12 * pulse;
  ctx.strokeStyle = COLORS.tealTotem55;
  ctx.lineWidth = 2 + 2 * pulse;
  ctx.beginPath();
  ctx.arc(sx, sy, totem.r, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.shadowColor = COLORS.tealTotem55;
  ctx.shadowBlur = 18 + 8 * pulse;
  ctx.fillStyle = COLORS.tealTotem78;
  ctx.beginPath();
  ctx.roundRect(sx - 10, sy - 18, 20, 36, 6);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = COLORS.white55;
  ctx.fillRect(sx - 2, sy - 12, 4, 24);

  // Direction arrow to totem (when it's off-screen and player is outside).
  if (!totem.inZone) {
    renderOffscreenArrow(ctx, camX, camY, w, h, player.x, player.y, totem.x, totem.y, "totem");
  }
}
