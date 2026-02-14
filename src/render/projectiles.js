import { TAU } from "../core/constants.js";
import { len2 } from "../utils/math.js";
import { batchCircleDraw, batchCirclePush, batchMapPush } from "../systems/render.js";
import { COLORS } from "./colors.js";

export function renderBullets({ ctx, bullets, camX, camY, batchBullets }) {
  for (const b of bullets) {
    const sx = b.x - camX;
    const sy = b.y - camY;
    if (b.isNova) {
      const spd = len2(b.vx, b.vy) || 1;
      const ux = b.vx / spd;
      const uy = b.vy / spd;
      const tx = sx - ux * 20;
      const ty = sy - uy * 20;
      const px = -uy;
      const py = ux;
      const w0 = Math.max(3, b.r * 0.9);
      const w1 = Math.max(0.8, b.r * 0.2);
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = COLORS.purpleNova35;
      ctx.moveTo(sx + px * w0, sy + py * w0);
      ctx.lineTo(sx - px * w0, sy - py * w0);
      ctx.lineTo(tx - px * w1, ty - py * w1);
      ctx.lineTo(tx + px * w1, ty + py * w1);
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = COLORS.purpleNova80;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.fillStyle = COLORS.purpleNovaCore95;
      ctx.arc(sx, sy, b.r, 0, TAU);
      ctx.fill();
      ctx.restore();
    } else {
      batchCirclePush(batchBullets, sx, sy, b.r);
    }
  }
  batchCircleDraw(ctx, batchBullets, COLORS.sandBullet95);
}

export function renderEnemyBullets({ ctx, enemyBullets, camX, camY, batchEnemyBullets }) {
  for (const b of enemyBullets) {
    const sx = b.x - camX;
    const sy = b.y - camY;
    if (b.trail === "sniper") {
      const spd = len2(b.vx, b.vy) || 1;
      const ux = b.vx / spd;
      const uy = b.vy / spd;
      const stepDist = Math.max(5, b.r * 1.9);
      const steps = 3;
      const headCol = b.color || COLORS.blueBright95;
      const tailCol = b.trailColor || COLORS.blueSoft75;
      const glowCol = b.glow || COLORS.blueGlowSoft70;
      ctx.save();
      ctx.fillStyle = tailCol;
      ctx.shadowColor = glowCol;
      ctx.shadowBlur = 14;
      for (let i = 1; i <= steps; i++) {
        const p = 1 - i / (steps + 1);
        ctx.globalAlpha = 0.18 + 0.12 * p;
        const r = b.r * (0.65 + 0.2 * p);
        ctx.beginPath();
        ctx.arc(sx - ux * stepDist * i, sy - uy * stepDist * i, r, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.fillStyle = headCol;
      ctx.arc(sx, sy, b.r, 0, TAU);
      ctx.fill();
      ctx.restore();
      continue;
    }
    const col = b.color || COLORS.pinkEnemyBullet90;
    if (b.glow) {
      ctx.save();
      ctx.shadowColor = b.glow;
      ctx.shadowBlur = b.glowBlur || 14;
      ctx.beginPath();
      ctx.fillStyle = col;
      ctx.arc(sx, sy, b.r, 0, TAU);
      ctx.fill();
      ctx.restore();
    } else {
      batchMapPush(batchEnemyBullets, col, sx, sy, b.r);
    }
  }
  for (const [col, arr] of batchEnemyBullets) {
    batchCircleDraw(ctx, arr, col);
  }
}
