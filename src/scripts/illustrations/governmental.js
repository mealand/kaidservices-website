import { F, FR, L, R, dimH, dimV, frame, ground, lit, range } from './helpers.js';

export default function governmental() {
  const columnsX = range(0, 6, 1).map((i) => 162 + i * 26);

  const fills =
    FR(60, 205, 90, 95) +
    FR(330, 205, 90, 95) +
    FR(150, 170, 180, 106) +
    F('M145 170L240 128L335 170Z', 'f--dark') +
    FR(205, 100, 70, 28, 'f--dark') +
    F('M205 100A35 35 0 0 1 275 100Z') +
    F('M95 152h44v26H95z', 'f--accent flag') +
    F('M385 152h-44v26h44z', 'f--accent flag');

  const columns = columnsX.map((x) => R(x, 188, 10, 82) + L(`M${x - 3} 188h16M${x - 3} 270h16`)).join('');

  const arch = (x, y) => `M${x} ${y + 34}V${y + 10}A10 10 0 0 1 ${x + 20} ${y + 10}V${y + 34}Z`;
  const wingWindows = [70, 98, 126, 336, 364, 392].map((x) => L(arch(x - 2, 225))).join('');
  const lights = [70, 126, 364].map((x, i) => lit(x, 237, 16, 21, i * 1.1)).join('');

  return frame(
    'governmental',
    '',
    fills +
      lights +
      ground() +
      // Steps
      L('M110 300H370M120 292H360M130 284H350M140 276H340', 'l--soft') +
      // Wings
      R(60, 205, 90, 95, 'l--thick') +
      R(330, 205, 90, 95, 'l--thick') +
      L('M56 205h98M326 205h98') +
      wingWindows +
      // Portico
      R(150, 170, 180, 106) +
      R(150, 170, 180, 15) +
      columns +
      L('M145 170L240 128L335 170Z', 'l--thick') +
      `<circle class="l l--accent" cx="240" cy="154" r="7" pathLength="1"/>` +
      // Drum, dome, lantern
      R(205, 100, 70, 28) +
      L(range(215, 265, 10).map((x) => `M${x} 104v20`).join(''), 'l--soft') +
      L('M205 100A35 35 0 0 1 275 100', 'l--thick') +
      L('M222 100Q226 72 240 65M258 100Q254 72 240 65M240 100V65', 'l--soft') +
      R(233, 52, 14, 13) +
      L('M240 52V38') +
      `<circle class="beacon" cx="240" cy="36" r="2.5"/>` +
      // Flagpoles
      L('M95 300V148M385 300V148') +
      L('M95 152h44v26H95zM385 152h-44v26h44z', 'l--accent') +
      dimH(60, 420, 322, 'G-04 · CIVIC CENTRE') +
      dimV(450, 36, 300, '+32.0'),
  );
}
