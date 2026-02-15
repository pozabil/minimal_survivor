import { batchCircleDraw, batchCirclePush } from "../../systems/render.js";
import { COLORS } from "../colors.js";

export function renderOrbitals({ ctx, player, clones, state, camX, camY, pF, batch }) {
  if (player.orbitals > 0) {
    const positions = state.orbitalPositions;
    if (positions) {
      const orbSize = pF.getOrbitalSize();
      for (let i = 0; i < positions.length; i += 2) {
        const sx = positions[i] - camX;
        const sy = positions[i + 1] - camY;
        batchCirclePush(batch.orbitals, sx, sy, orbSize);
      }
      batchCircleDraw(ctx, batch.orbitals, COLORS.bluePlayer95);
    }
  }
  if (player.orbitals > 0 && clones.length) {
    const orbSize = pF.getOrbitalSize();
    for (const sc of clones) {
      const positions = sc.orbitalPositions;
      if (!positions) continue;
      for (let i = 0; i < positions.length; i += 2) {
        const sx = positions[i] - camX;
        const sy = positions[i + 1] - camY;
        batchCirclePush(batch.orbitalsClone, sx, sy, orbSize);
      }
    }
    batchCircleDraw(ctx, batch.orbitalsClone, COLORS.blueOrbitalClone70);
  }
}
