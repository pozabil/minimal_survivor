import { clamp, lerp, len2 } from "../utils/math.js";

export function createUpdateCamera({ player, pF, gameScale, cameraZoomOut }) {
  return function updateCamera({ cameraScale, lerpFast, moveSpeed }) {
    const spd = len2(player.vx, player.vy) || 0;
    const ratio = clamp(spd / Math.max(1, moveSpeed), 0, 1);
    const baseSpd = pF.getBaseMoveSpeed();
    const speedBonus = moveSpeed / baseSpd;
    const targetScale = gameScale * (1 - cameraZoomOut * speedBonus * ratio);
    return lerp(cameraScale, targetScale, lerpFast);
  };
}
