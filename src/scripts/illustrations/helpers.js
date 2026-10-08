/**
 * Tiny SVG string builders for the blueprint-style sector illustrations.
 * Line elements (.l) draw on via stroke-dashoffset; fills (.f) fade in after.
 * Canvas: 480 × 340, ground line at y = 300.
 */
export const GROUND = 300;

/** Deterministic PRNG so illustrations render identically on every load. */
export function rng(seed) {
  let s = seed % 2147483647;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export const range = (from, to, step) => {
  const out = [];
  for (let v = from; step > 0 ? v <= to : v >= to; v += step) out.push(v);
  return out;
};

export const L = (d, cls = '') => `<path class="l ${cls}" d="${d}" pathLength="1"/>`;
export const R = (x, y, w, h, cls = '') => `<rect class="l ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" pathLength="1"/>`;
export const Ci = (cx, cy, r, cls = '') => `<circle class="l ${cls}" cx="${cx}" cy="${cy}" r="${r}" pathLength="1"/>`;
export const F = (d, cls = '', extra = '') => `<path class="f ${cls}" d="${d}" ${extra}/>`;
export const FR = (x, y, w, h, cls = '', extra = '') => `<rect class="f ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" ${extra}/>`;

/** Lit window that glows on a staggered loop. */
export const lit = (x, y, w, h, delay) => `<rect class="lit" x="${x}" y="${y}" width="${w}" height="${h}" style="--d:${delay.toFixed(2)}s"/>`;

export function ground() {
  const ticks = range(20, 460, 14).map((x) => `M${x} ${GROUND}l-6 7`).join('');
  return L(`M10 ${GROUND}H470`, 'l--thick') + L(ticks, 'l--soft');
}

/** Horizontal dimension line with end ticks and a label. */
export function dimH(x1, x2, y, label) {
  return (
    L(`M${x1} ${y}H${x2}M${x1} ${y - 5}v10M${x2} ${y - 5}v10`, 'l--soft') +
    `<text class="dim-txt" x="${(x1 + x2) / 2}" y="${y - 6}" text-anchor="middle">${label}</text>`
  );
}

/** Vertical dimension line with end ticks and a label. */
export function dimV(x, y1, y2, label) {
  return (
    L(`M${x} ${y1}V${y2}M${x - 5} ${y1}h10M${x - 5} ${y2}h10`, 'l--soft') +
    `<text class="dim-txt" x="${x + 6}" y="${y1 + 10}">${label}</text>`
  );
}

export function glassGradient(id) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#20303f"/><stop offset="1" stop-color="#0f161e"/></linearGradient>`;
}

export function frame(id, defs, body) {
  return `<svg class="ill ill--${id}" viewBox="0 0 480 340" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs>${defs}</defs>${body}</svg>`;
}
