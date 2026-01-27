export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const len2 = (x, y) => Math.sqrt(x * x + y * y);
export const len2Sq = (x, y) => x * x + y * y;
