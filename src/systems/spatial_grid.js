import { GRID_SIZE } from "../core/constants.js";

export function createSpatialGrid(enemies){
  const enemyGrid = new Map();
  const cellPool = [];

  function gridKey(cx, cy){
    return cx + "," + cy;
  }

  function gridBuild(){
    for (const cell of enemyGrid.values()){
      cell.length = 0;
      cellPool.push(cell);
    }
    enemyGrid.clear();
    for (const e of enemies){
      if (e.dead || e.dying) continue;
      const cx = Math.floor(e.x / GRID_SIZE);
      const cy = Math.floor(e.y / GRID_SIZE);
      const key = gridKey(cx, cy);
      let cell = enemyGrid.get(key);
      if (!cell){
        cell = cellPool.pop() || [];
        enemyGrid.set(key, cell);
      }
      cell.push(e);
    }
  }

  function gridQueryCircle(x, y, r, out){
    out.length = 0;
    const minCx = Math.floor((x - r) / GRID_SIZE);
    const maxCx = Math.floor((x + r) / GRID_SIZE);
    const minCy = Math.floor((y - r) / GRID_SIZE);
    const maxCy = Math.floor((y + r) / GRID_SIZE);
    for (let cy = minCy; cy <= maxCy; cy++){
      for (let cx = minCx; cx <= maxCx; cx++){
        const cell = enemyGrid.get(gridKey(cx, cy));
        if (cell) out.push(...cell);
      }
    }
    return out;
  }

  // Expose for debug visualization (read-only use).
  function getGridCells(){
    return enemyGrid;
  }

  return { gridBuild, gridQueryCircle, getGridCells };
}
