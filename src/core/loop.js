export function startLoop(step) {
  let last = performance.now();

  function frame(now) {
    const dtRaw = (now - last) / 1000;
    last = now;
    step(now, dtRaw);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
