import { clamp } from "../../utils/math.js";
import { COLORS } from "../colors.js";

export function renderVignette({ ctx, w, h, player, t }) {
  const grd = ctx.createRadialGradient(
    w * 0.5,
    h * 0.5,
    Math.min(w, h) * 0.15,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.75
  );
  const hpRatio = player.hpMax > 0 ? player.hp / player.hpMax : 1;
  const low = clamp((0.5 - hpRatio) / 0.5, 0, 1);
  let edgeColor = COLORS.black55;
  if (low > 0) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 6);
    const r = Math.round(255 + (200 - 255) * low);
    const g = Math.round(140 + (20 - 140) * low);
    const b = Math.round(60 + (20 - 60) * low);
    const alpha = (0.45 + 0.25 * low) * pulse;
    edgeColor = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
  }
  grd.addColorStop(0, COLORS.black0);
  grd.addColorStop(1, edgeColor);
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, w, h);
}
