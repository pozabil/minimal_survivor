import { TAU } from "../../core/constants.js";
import { clamp, lerp } from "../../utils/math.js";
import { COLORS } from "../colors.js";

export function createEffectRenderer({
  particles,
  shockwaves,
  lightningStrikes,
  floaters,
  dashTrail,
}) {
  function renderLightning(ctx, camX, camY) {
    if (!lightningStrikes.length) return;
    for (const s of lightningStrikes) {
      const alpha = 1 - (s.t / s.life);

      ctx.save();
      ctx.globalAlpha = 0.85 * alpha;
      ctx.lineWidth = 2 + 2 * alpha;
      ctx.strokeStyle = COLORS.blueLightning95;
      ctx.shadowColor = COLORS.blueGlow90;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      const pts = s.pts || [];
      if (pts.length) {
        ctx.moveTo(pts[0].x - camX, pts[0].y - camY);
        for (let i = 1; i < pts.length; i++) {
          const p = pts[i];
          ctx.lineTo(p.x - camX, p.y - camY);
        }
        ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = 0.9 * alpha;
      ctx.fillStyle = COLORS.white90;
      ctx.shadowColor = COLORS.blueGlow90;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(s.x - camX, s.y - camY, 6 + 6 * alpha, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function renderShockwaves(ctx, camX, camY) {
    if (!shockwaves.length) return;
    for (const s of shockwaves) {
      const p = clamp(s.t / Math.max(0.001, s.life), 0, 1);
      const r = lerp(s.r0, s.r1, p);
      const a = 1 - p;

      ctx.save();
      ctx.globalAlpha = 0.85 * a;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2 + 5 * a;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(s.x - camX, s.y - camY, r, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function renderParticles(ctx, camX, camY) {
    if (!particles.length) return;
    for (const p of particles) {
      const sx = p.x - camX;
      const sy = p.y - camY;
      const a = 1 - (p.t / p.life);

      ctx.globalAlpha = 0.85 * a;
      ctx.beginPath();
      ctx.fillStyle = COLORS.white90;
      ctx.arc(sx, sy, p.r, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function renderDashTrail(ctx, camX, camY) {
    if (!dashTrail.length) return;
    ctx.save();
    ctx.fillStyle = COLORS.blueSoft90;
    ctx.shadowColor = COLORS.blueGlowSoft70;
    ctx.shadowBlur = 18;
    for (const d of dashTrail) {
      const p = 1 - (d.t / d.life);
      const alpha = 0.22 * p;
      const r = d.r * (0.75 + 0.25 * p);
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(d.x - camX, d.y - camY, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function renderFloaters(ctx, camX, camY) {
    if (!floaters.length) return;
    ctx.save();
    const baseSize = 18;
    const baseFont = "system-ui,-apple-system,Segoe UI,Roboto,Arial";
    ctx.font = `700 ${baseSize}px ${baseFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const f of floaters) {
      const sx = f.x - camX;
      const sy = f.y - camY;
      const a = 1 - (f.t / f.life);
      ctx.globalAlpha = 0.9 * a;

      if (f.size && f.size !== baseSize) {
        ctx.font = `700 ${f.size}px ${baseFont}`;
      } else if (ctx.font !== `700 ${baseSize}px ${baseFont}`) {
        ctx.font = `700 ${baseSize}px ${baseFont}`;
      }

      ctx.fillStyle = f.color || COLORS.greenHeal;
      ctx.fillText(f.text, sx, sy);
    }
    ctx.restore();
  }

  return {
    renderLightning,
    renderShockwaves,
    renderParticles,
    renderDashTrail,
    renderFloaters,
  };
}
