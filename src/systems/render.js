import { TAU } from "../core/constants.js";
import { len2 } from "../utils/math.js";

const ARROW_PRESETS = {
  totem: {
    margin: 34,
    minReach: 56,
    tip: 22,
    back: -16,
    wing: 12,
    fill: "rgba(90,220,190,0.95)",
    stroke: "rgba(210,255,245,0.7)",
    alpha: 0.95,
    lineWidth: 2,
    isSpecial: false,
  },
  chest: {
    margin: 26,
    minReach: 40,
    tip: 16,
    back: -12,
    wing: 9,
    fill: "rgba(255,220,120,0.95)",
    stroke: "rgba(255,255,255,0.55)",
    alpha: 0.90,
    lineWidth: 2,
    isSpecial: false,
  },
  specialChest: {
    margin: 30,
    minReach: 46,
    tip: 16,
    back: -12,
    wing: 9,
    fill: "rgba(255,220,120,0.95)",
    stroke: "rgba(255,255,255,0.55)",
    alpha: 0.90,
    lineWidth: 2,
    isSpecial: true,
    specialScale: 1.4,
    specialFill: "rgba(255,70,70,0.9)",
    specialStroke: "rgba(255,160,160,0.9)",
    specialFillAlpha: 0.7,
    specialStrokeAlpha: 0.8,
    specialLineWidth: 1.5,
  },
};

export function renderFrame() {}

export function createRenderBatch() {
  return {
    bullets: [],
    enemyBullets: new Map(),
    orbitals: [],
    orbitalsClone: [],
  };
}

export function batchCirclePush(arr, x, y, r) {
  arr.push(x, y, r);
}

export function batchCircleDraw(ctx, arr, fillStyle) {
  if (!arr.length) return;
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  for (let i = 0; i < arr.length; i += 3) {
    const x = arr[i];
    const y = arr[i + 1];
    const r = arr[i + 2];
    ctx.moveTo(x + r, y);
    ctx.arc(x, y, r, 0, TAU);
  }
  ctx.fill();
}

export function batchMapPush(map, key, x, y, r) {
  let arr = map.get(key);
  if (!arr) {
    arr = [];
    map.set(key, arr);
  }
  arr.push(x, y, r);
}

export function batchMapClear(map) {
  for (const arr of map.values()) arr.length = 0;
}

export function ensureRoundRectPolyfill() {
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      this.beginPath();
      this.moveTo(x + rr, y);
      this.arcTo(x + w, y, x + w, y + h, rr);
      this.arcTo(x + w, y + h, x, y + h, rr);
      this.arcTo(x, y + h, x, y, rr);
      this.arcTo(x, y, x + w, y, rr);
      this.closePath();
      return this;
    };
  }
}

export function renderOffscreenArrow(
  ctx,
  camX,
  camY,
  viewW,
  viewH,
  playerX,
  playerY,
  targetX,
  targetY,
  type = "chest"
) {
  const preset = ARROW_PRESETS[type] || ARROW_PRESETS.chest;
  const margin = preset.margin;
  const reach = Math.max(preset.minReach, Math.min(viewW * 0.5, viewH * 0.5) - margin);
  const tip = preset.tip;
  const back = preset.back;
  const wing = preset.wing;
  const fill = preset.fill;
  const stroke = preset.stroke;
  const alpha = preset.alpha;
  const lineWidth = preset.lineWidth;
  const isSpecial = preset.isSpecial;

  const sx = targetX - camX;
  const sy = targetY - camY;
  const onScreen = (sx >= 0 && sx <= viewW && sy >= 0 && sy <= viewH);
  if (onScreen) return;

  const dx = targetX - playerX;
  const dy = targetY - playerY;
  const dist = len2(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  const cx = viewW * 0.5;
  const cy = viewH * 0.5;

  let ax = cx + ux * reach;
  let ay = cy + uy * reach;
  ax = Math.max(margin, Math.min(viewW - margin, ax));
  ay = Math.max(margin, Math.min(viewH - margin, ay));

  const ang = Math.atan2(uy, ux);

  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(ang);
  ctx.globalAlpha = alpha;

  if (isSpecial) {
    addSpecialArrow(ctx, preset);
    ctx.globalAlpha = alpha;
  }

  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(tip, 0);
  ctx.lineTo(back, wing);
  ctx.lineTo(back, -wing);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = alpha * 0.7;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.restore();
}

function addSpecialArrow(ctx, preset) {
  const {
    tip,
    back,
    wing,
    specialScale,
    specialFill,
    specialStroke,
    specialFillAlpha,
    specialStrokeAlpha,
    specialLineWidth,
  } = preset;

  ctx.globalAlpha = specialFillAlpha;
  ctx.fillStyle = specialFill;
  ctx.beginPath();
  ctx.moveTo(tip * specialScale * 1.25, 0);
  ctx.lineTo(back * specialScale, wing * specialScale * 1.125);
  ctx.lineTo(back * specialScale, -wing * specialScale * 1.125);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = specialStrokeAlpha;
  ctx.strokeStyle = specialStroke;
  ctx.lineWidth = specialLineWidth;
  ctx.stroke();
}
