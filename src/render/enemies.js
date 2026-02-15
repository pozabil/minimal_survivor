import { BURST_TELEGRAPH } from "../content/enemies.js";
import { TAU } from "../core/constants.js";
import { clamp } from "../utils/math.js";
import { COLORS } from "./colors.js";

export function renderEnemies({ ctx, enemies, state, camX, camY }) {
  for (const e of enemies) {
    const sx = e.x - camX;
    const sy = e.y - camY;
    let baseCol = e.type === "boss" ? COLORS.purpleBoss95 : COLORS.redEnemyBase92;
    if (e.type === "tank") baseCol = COLORS.red95;
    if (e.type === "runner") baseCol = COLORS.orangeRunner95;
    if (e.type === "shooter") baseCol = COLORS.tealShooter92;
    if (e.type === "bomber") baseCol = COLORS.goldBomber92;
    if (e.type === "spitter_pale") baseCol = COLORS.paleBloodSpitter92;
    if (e.type === "triad") baseCol = COLORS.blueTriad95;
    if (e.type === "blaster") baseCol = COLORS.blueBlaster95;
    if (e.type === "burst") baseCol = COLORS.blueBurst95;
    if (e.type === "boss") {
      if (e.bossKind === "sniper") baseCol = COLORS.blueBright95;
      if (e.bossKind === "charger") baseCol = COLORS.orangeBossCharger95;
      if (e.bossKind === "spiral") baseCol = COLORS.purpleBossSpiral95;
      if (e.bossKind === "summoner") baseCol = COLORS.greenBossSummoner92;
    }
    if (e.type === "boss") {
      const waveT = (state.t * 0.55 + e.id * 0.17) % 1;
      const waveR = e.r + 12 + waveT * 78;
      ctx.save();
      ctx.globalAlpha = 0.28 * (1 - waveT);
      ctx.strokeStyle = baseCol;
      ctx.lineWidth = 2 + waveT * 2;
      ctx.beginPath();
      ctx.arc(sx, sy, waveR, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    let blasterCharge = 0;
    let blasterFillFromBack = true;
    if (e.type === "blaster") {
      const cd = e.burstCooldown || 1.0;
      if ((e.blastKind || 0) === 1) {
        if ((e.holdT || 0) > 0) blasterCharge = 1;
        else if ((e.burstCd || 0) > 0) blasterCharge = clamp(1 - ((e.burstCd || 0) / cd), 0, 1);
        else blasterCharge = 1;
      } else {
        if ((e.burstLeft || 0) > 0 && (e.burstTotal || 0) > 0) {
          blasterCharge = clamp((e.burstLeft || 0) / (e.burstTotal || 1), 0, 1);
          blasterFillFromBack = false;
        } else if ((e.burstCd || 0) > 0) {
          blasterCharge = clamp(1 - ((e.burstCd || 0) / cd), 0, 1);
        } else {
          blasterCharge = 1;
        }
      }
    }
    if (e.type === "triad") {
      const rad = e.triRad || 22;
      const a0 = e.triAngle || 0;
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = COLORS.blueTriad45;
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const ang = a0 + k * (TAU / 3);
        const vx = sx + Math.cos(ang) * rad;
        const vy = sy + Math.sin(ang) * rad;
        if (k === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.save();
    if (e.type === "blaster" && blasterCharge > 0) {
      ctx.shadowColor = e.bulletGlow || COLORS.goldGlow95;
      ctx.shadowBlur = 16 + blasterCharge * 18;
    }
    const auraFlash = (e.auraFlash || 0) > 0;
    if (e.hitFlash > 0) {
      if (e.type === "boss") {
        ctx.beginPath();
        ctx.fillStyle = baseCol;
        ctx.arc(sx, sy, e.r, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.fillStyle = COLORS.white95;
        ctx.arc(sx, sy, e.r, 0, TAU);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.fillStyle = COLORS.white95;
        ctx.arc(sx, sy, e.r, 0, TAU);
        ctx.fill();
      }
    } else if (auraFlash) {
      ctx.beginPath();
      ctx.fillStyle = baseCol;
      ctx.arc(sx, sy, e.r, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.60;
      ctx.beginPath();
      ctx.fillStyle = COLORS.white95;
      ctx.arc(sx, sy, e.r, 0, TAU);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.fillStyle = baseCol;
      ctx.arc(sx, sy, e.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    if (e.type === "blaster") {
      if (blasterCharge > 0) {
        const dirX = e.moveDirX || 1;
        const dirY = e.moveDirY || 0;
        const ang = Math.atan2(dirY, dirX);
        const rr = e.r;
        const fillW = (rr * 2) * blasterCharge;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.arc(0, 0, rr, 0, TAU);
        ctx.clip();
        ctx.globalAlpha = 0.95;
        ctx.shadowColor = e.bulletGlow || COLORS.goldGlow95;
        ctx.shadowBlur = 26;
        ctx.fillStyle = e.bulletColor || COLORS.goldBullet98;
        const x0 = blasterFillFromBack ? -rr : (rr - fillW);
        ctx.fillRect(x0, -rr, fillW, rr * 2);
        ctx.restore();
      }
    }

    if (e.dying) {
      const p = clamp(1 - (e.deathT / BURST_TELEGRAPH), 0, 1);
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 2 + p * 3;
      ctx.strokeStyle = COLORS.goldTelegraph95;
      ctx.beginPath();
      ctx.arc(sx, sy, e.r + 6 + p * 6, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (e.elite) {
      const pulse = 0.5 + 0.5 * Math.sin(state.t * 5 + e.id * 0.7);
      ctx.globalAlpha = 0.55 + pulse * 0.25;
      ctx.lineWidth = 3;
      ctx.strokeStyle = e.eliteColor || COLORS.goldElite90;
      ctx.beginPath();
      ctx.arc(sx, sy, e.r + 5 + pulse * 4, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (e.type === "boss" || e.type === "tank") {
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 3;
      ctx.strokeStyle = COLORS.black35;
      ctx.beginPath();
      ctx.arc(sx, sy, e.r + 3, 0, TAU);
      ctx.stroke();

      const p = clamp(e.hp / e.hpMax, 0, 1);
      ctx.strokeStyle = COLORS.white65;
      ctx.beginPath();
      ctx.arc(sx, sy, e.r + 3, -Math.PI / 2, -Math.PI / 2 + TAU * p);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}
