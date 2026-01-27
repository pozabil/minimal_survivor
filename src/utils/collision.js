import { clamp, len2 } from "./math.js";

export function circleHit(ax, ay, ar, bx, by, br) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy <= (ar + br) * (ar + br);
}

export function circleRectHit(cx, cy, cr, rx, ry, rw, rh) {
  const hx = rw * 0.5;
  const hy = rh * 0.5;
  const dx = Math.abs(cx - rx);
  const dy = Math.abs(cy - ry);
  if (dx > hx + cr || dy > hy + cr) return false;
  if (dx <= hx || dy <= hy) return true;
  const ax = dx - hx;
  const ay = dy - hy;
  return ax * ax + ay * ay <= cr * cr;
}

export function resolveCircleRect(cx, cy, cr, rx, ry, rw, rh) {
  const hx = rw * 0.5;
  const hy = rh * 0.5;
  const dx = cx - rx;
  const dy = cy - ry;
  const clx = clamp(dx, -hx, hx);
  const cly = clamp(dy, -hy, hy);
  const closestX = rx + clx;
  const closestY = ry + cly;
  const vx = cx - closestX;
  const vy = cy - closestY;
  const distSq = vx * vx + vy * vy;
  if (distSq > cr * cr) return null;
  if (distSq > 0) {
    const dist = Math.sqrt(distSq);
    const push = cr - dist;
    return { x: (vx / dist) * push, y: (vy / dist) * push };
  }
  const overlapX = hx + cr - Math.abs(dx);
  const overlapY = hy + cr - Math.abs(dy);
  if (overlapX < overlapY) return { x: Math.sign(dx || 1) * overlapX, y: 0 };
  return { x: 0, y: Math.sign(dy || 1) * overlapY };
}

// anti-sticky push vector from B -> A
export function pushAway(ax, ay, bx, by, strength) {
  const dx = ax - bx;
  const dy = ay - by;
  const d = len2(dx, dy) || 1;
  return { x: (dx / d) * strength, y: (dy / d) * strength };
}
