export function fmtTime(t) {
  const mm = Math.floor(t / 60);
  const ss = Math.floor(t % 60);
  return String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
}

export function fmtPct(v) {
  if (!Number.isFinite(v)) return "--";
  return `${Math.round(v * 100)}%`;
}

export function fmtNum(v, digits = 0) {
  if (!Number.isFinite(v)) return "--";
  return digits ? v.toFixed(digits) : String(Math.round(v));
}

export function fmtSignedPct(v) {
  if (!Number.isFinite(v)) return "--";
  const pct = Math.round(v * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}
