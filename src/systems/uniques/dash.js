import {
  DASH_DISTANCE,
  DASH_DURATION,
  DASH_COOLDOWN,
  DASH_INVULN,
} from "../../content/uniques.js";
import { len2 } from "../../utils/math.js";

export function createDashSystem({
  player,
  state,
  pF,
  keys,
  isTouch,
  joyVec,
  spawnDashTrail,
}) {
  function getDashDir(dirX, dirY){
    if (Number.isFinite(dirX) && Number.isFinite(dirY) && (dirX !== 0 || dirY !== 0)){
      const d = len2(dirX, dirY) || 1;
      return { x: dirX / d, y: dirY / d };
    }
    let ix = 0;
    let iy = 0;
    if (keys.has("KeyW") || keys.has("ArrowUp")) iy -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) iy += 1;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) ix -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) ix += 1;
    if (isTouch){
      ix += joyVec.x;
      iy += joyVec.y;
    }
    const ilen = len2(ix, iy);
    if (ilen > 0.2) return { x: ix / ilen, y: iy / ilen };
    const spd = len2(player.vx, player.vy);
    if (spd > 1) return { x: player.vx / spd, y: player.vy / spd };
    const ld = len2(player.lastDirX || 0, player.lastDirY || 0) || 1;
    return { x: (player.lastDirX || 1) / ld, y: (player.lastDirY || 0) / ld };
  }

  return function triggerDash(dirX, dirY){
    if (!pF.hasUnique("british_citizenship")) return false;
    if (player.dashCd > 0 || state.dashT > 0) return false;

    const dir = getDashDir(dirX, dirY);
    const ux = dir.x;
    const uy = dir.y;
    const dashSpeed = DASH_DISTANCE / DASH_DURATION;

    state.dashT = DASH_DURATION;
    state.dashVx = ux * dashSpeed;
    state.dashVy = uy * dashSpeed;
    player.vx = state.dashVx;
    player.vy = state.dashVy;
    player.invuln = Math.max(player.invuln, DASH_INVULN);
    player.dashCd = DASH_COOLDOWN;
    state.dashTrailT = 0;
    spawnDashTrail();
    return true;
  };
}
