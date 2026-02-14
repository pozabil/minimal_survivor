import { batchMapClear } from "../systems/render.js";
import { COLORS } from "./colors.js";

export function setupCameraAndFrame({ ctx, getDpr, cameraScale, player, batch }) {
  const dprScale = getDpr() * cameraScale;
  ctx.setTransform(dprScale, 0, 0, dprScale, 0, 0);

  const w = innerWidth / cameraScale;
  const h = innerHeight / cameraScale;

  const camX = player.x - w * 0.5;
  const camY = player.y - h * 0.5;

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w, h);

  batch.bullets.length = 0;
  batch.orbitals.length = 0;
  batch.orbitalsClone.length = 0;
  batchMapClear(batch.enemyBullets);

  return { w, h, camX, camY };
}
