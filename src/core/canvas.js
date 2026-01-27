export function initCanvas(canvas, gameScale, maxDpr) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is not available (canvas.getContext('2d') returned null).");
  }

  let curDpr = 1;

  const resize = () => {
    curDpr = Math.max(1, Math.min(maxDpr, window.devicePixelRatio || 1));
    canvas.width = Math.floor(innerWidth * curDpr);
    canvas.height = Math.floor(innerHeight * curDpr);
    // dpr * gameScale — это zoom-out без потери "CSS fullscreen"
    ctx.setTransform(curDpr * gameScale, 0, 0, curDpr * gameScale, 0, 0);
  };

  addEventListener("resize", resize, { passive: true });
  resize();

  return {
    ctx,
    resize,
    getDpr: () => curDpr,
  };
}
