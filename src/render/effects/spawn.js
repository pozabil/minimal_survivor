import {
  DASH_TRAIL_LIFE,
  DASH_TRAIL_MAX,
  LIGHTNING_STRIKE_LIFE,
  LIGHTNING_STRIKE_SEGMENTS_MIN,
  LIGHTNING_STRIKE_SEGMENTS_MAX,
  LIGHTNING_STRIKE_JITTER,
  LIGHTNING_STRIKE_HEIGHT_MIN,
  LIGHTNING_STRIKE_HEIGHT_MAX,
} from "../../content/uniques.js";
import { TAU } from "../../core/constants.js";
import { randf, randi } from "../../utils/rand.js";
import { COLORS } from "../colors.js";

export function createEffectSpawns({
  player,
  particles,
  shockwaves,
  lightningStrikes,
  floaters,
  dashTrail,
}) {
  function spawnBurst(x, y, count, spd, life) {
    for (let i = 0; i < count; i++) {
      const a = randf(0, TAU);
      particles.push({
        x,
        y,
        vx: Math.cos(a) * randf(spd * 0.4, spd),
        vy: Math.sin(a) * randf(spd * 0.4, spd),
        r: randf(1.5, 3.5),
        life: randf(life * 0.6, life),
        t: 0,
      });
    }
  }

  function spawnShockwave(x, y, r0, r1, life, color) {
    shockwaves.push({
      x,
      y,
      r0,
      r1,
      life,
      t: 0,
      color: color || COLORS.blueSoft95,
    });
  }

  function spawnDashTrail() {
    dashTrail.push({
      x: player.x,
      y: player.y,
      r: player.r * 0.95,
      t: 0,
      life: DASH_TRAIL_LIFE,
    });
    if (dashTrail.length > DASH_TRAIL_MAX) dashTrail.shift();
  }

  function spawnLightningStrike(x, y) {
    const height = randf(LIGHTNING_STRIKE_HEIGHT_MIN, LIGHTNING_STRIKE_HEIGHT_MAX);
    const topY = y - height;
    const segments = randi(LIGHTNING_STRIKE_SEGMENTS_MIN, LIGHTNING_STRIKE_SEGMENTS_MAX);
    const pts = [{ x, y: topY }];
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const px = x + randf(-LIGHTNING_STRIKE_JITTER, LIGHTNING_STRIKE_JITTER);
      const py = topY + (y - topY) * t;
      pts.push({ x: px, y: py });
    }
    pts.push({ x, y });
    lightningStrikes.push({ pts, x, y, t: 0, life: LIGHTNING_STRIKE_LIFE });
  }

  function spawnHealFloat(amount) {
    const value = Math.round(amount);
    if (value <= 0) return;
    floaters.push({
      x: player.x + randf(-10, 10),
      y: player.y + randf(-12, 0),
      vx: randf(-18, 18),
      vy: randf(-50, -30),
      t: 0,
      life: 0.9,
      text: `+${value}`,
      color: COLORS.greenHeal,
    });
  }

  function spawnDamageFloat(amount, x, y, color, size) {
    const value = Math.round(amount);
    if (value <= 0) return;
    const bx = Number.isFinite(x) ? x : player.x;
    const by = Number.isFinite(y) ? y : player.y;
    floaters.push({
      x: bx + randf(-10, 10),
      y: by + randf(-16, -4),
      vx: randf(-22, 22),
      vy: randf(-70, -50),
      t: 0,
      life: 0.9,
      text: `-${value}`,
      color: color || COLORS.redDamage95,
      size: Number.isFinite(size) ? size : null,
    });
  }

  return {
    spawnBurst,
    spawnShockwave,
    spawnDashTrail,
    spawnLightningStrike,
    spawnHealFloat,
    spawnDamageFloat,
  };
}
