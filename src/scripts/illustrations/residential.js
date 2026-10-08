import { FR, L, R, dimH, dimV, frame, glassGradient, ground, lit, range } from './helpers.js';

export default function residential() {
  const glass = 'fill="url(#g-residential)"';

  const fills =
    FR(70, 215, 240, 85) +
    FR(150, 140, 250, 75) +
    FR(90, 230, 120, 70, '', glass) +
    FR(170, 155, 110, 45, '', glass) +
    FR(320, 292, 120, 8, '', glass);

  const lights =
    lit(92, 232, 28, 66, 0) +
    lit(152, 232, 28, 66, 1.4) +
    lit(172, 157, 26, 41, 0.7) +
    lit(226, 157, 26, 41, 2.2);

  const screen = range(296, 392, 7).map((x) => `M${x} 150V206`).join('');

  const tree = (x, r, s) =>
    `<g class="sway" style="animation-delay:${s}s">${L(`M${x} 300V${300 - r * 1.6}`)}<circle class="l l--soft" cx="${x}" cy="${300 - r * 2.4}" r="${r}" pathLength="1"/><circle class="l l--soft" cx="${x - r * 0.5}" cy="${300 - r * 2}" r="${r * 0.6}" pathLength="1"/></g>`;

  return frame(
    'residential',
    glassGradient('g-residential'),
    fills +
      lights +
      ground() +
      // Massing
      R(70, 215, 240, 85, 'l--thick') +
      R(150, 140, 250, 75, 'l--thick') +
      L('M140 140H410M60 215H150') +
      // Ground floor glazing
      R(90, 230, 120, 70) +
      L('M120 230V300M150 230V300M180 230V300', 'l--soft') +
      R(232, 238, 30, 62) +
      L('M256 268h-4', 'l--accent') +
      // Upper glazing + timber screen
      R(170, 155, 110, 45) +
      L('M198 155V200M226 155V200M254 155V200', 'l--soft') +
      L(screen, 'l--soft') +
      // Cantilever support + pool
      L('M392 215V300') +
      R(320, 292, 120, 8, 'l--soft') +
      L('M300 300l14-10h-24', 'l--soft') +
      tree(38, 14, 0) +
      tree(450, 10, 1.2) +
      dimH(70, 400, 322, 'R-03 · 2 STOREY') +
      dimV(430, 140, 280, '+7.20'),
  );
}
