import { TAU } from "../../core/constants.js";
import { batchCircleDraw, batchCirclePush } from "../../systems/render.js";
import { COLORS } from "../colors.js";

export function drawOrbitals({ ctx, player, clones, state, camX, camY, pF, batch }) {
  if (player.orbitals > 0) {
    const orbSize = pF.getOrbitalSize();
    for (let k = 0; k < player.orbitals; k++) {
      const a = state.orbitalAngle + (k / Math.max(1, player.orbitals)) * TAU;
      const ox = player.x + Math.cos(a) * player.orbitalRadius;
      const oy = player.y + Math.sin(a) * player.orbitalRadius;
      const sx = ox - camX;
      const sy = oy - camY;
      batchCirclePush(batch.orbitals, sx, sy, orbSize);
    }
    batchCircleDraw(ctx, batch.orbitals, COLORS.bluePlayer95);
  }
  if (player.orbitals > 0 && clones.length) {
    const orbSize = pF.getOrbitalSize();
    for (const sc of clones) {
      const base = sc.orbitalAngle || 0;
      for (let k = 0; k < player.orbitals; k++) {
        const a = base + (k / Math.max(1, player.orbitals)) * TAU;
        const ox = sc.x + Math.cos(a) * player.orbitalRadius;
        const oy = sc.y + Math.sin(a) * player.orbitalRadius;
        const sx = ox - camX;
        const sy = oy - camY;
        batchCirclePush(batch.orbitalsClone, sx, sy, orbSize);
      }
    }
    batchCircleDraw(ctx, batch.orbitalsClone, COLORS.blueOrbitalClone70);
  }
}
