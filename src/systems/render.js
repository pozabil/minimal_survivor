import { TAU } from "../core/constants.js";

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
