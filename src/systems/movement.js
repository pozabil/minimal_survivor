import { resolveCircleRect } from "../utils/collision.js";

export function updateMovement({
  dt,
  keys,
  isTouch,
  joyVec,
  player,
  state,
  turrets,
  lerpFast,
  moveSpeed,
}) {
  let ix = 0;
  let iy = 0;
  if (keys.has("KeyW") || keys.has("ArrowUp")) iy -= 1;
  if (keys.has("KeyS") || keys.has("ArrowDown")) iy += 1;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) ix -= 1;
  if (keys.has("KeyD") || keys.has("ArrowRight")) ix += 1;
  if (isTouch) {
    ix += joyVec.x;
    iy += joyVec.y;
  }

  const ilen = Math.hypot(ix, iy) || 1;
  ix /= ilen;
  iy /= ilen;

  if (Math.hypot(ix, iy) > 0.2) {
    player.lastDirX = ix;
    player.lastDirY = iy;
  }
  player.dashCd = Math.max(0, player.dashCd - dt);
  const dashActive = state.dashT > 0;
  if (dashActive) {
    state.dashT = Math.max(0, state.dashT - dt);
  }

  let targetVx = ix * moveSpeed;
  let targetVy = iy * moveSpeed;
  if (dashActive) {
    targetVx = state.dashVx;
    targetVy = state.dashVy;
    player.vx = targetVx;
    player.vy = targetVy;
  } else {
    player.vx = lerpFast ? player.vx + (targetVx - player.vx) * lerpFast : targetVx;
    player.vy = lerpFast ? player.vy + (targetVy - player.vy) * lerpFast : targetVy;
  }

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  if (turrets.length) {
    for (const tur of turrets) {
      const push = resolveCircleRect(player.x, player.y, player.r, tur.x, tur.y, tur.size, tur.size);
      if (push) {
        player.x += push.x;
        player.y += push.y;
        const pd = Math.hypot(push.x, push.y) || 1;
        const nx = push.x / pd;
        const ny = push.y / pd;
        const vdot = player.vx * nx + player.vy * ny;
        if (vdot < 0) {
          player.vx -= vdot * nx;
          player.vy -= vdot * ny;
        }
      }
    }
  }

}
