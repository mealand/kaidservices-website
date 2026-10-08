import { F, FR, L, R, dimH, dimV, frame, glassGradient, ground, lit, range, rng } from './helpers.js';

export default function commercial() {
  const rand = rng(23);
  const glass = 'fill="url(#g-commercial)"';
  let lights = '';
  let delay = 0;
  const maybeLight = (x, y, w, h) => {
    if (rand() > 0.8) lights += lit(x + 1, y + 1, w - 2, h - 2, (delay += 0.37) % 4);
  };

  // Centre tower — slanted crown
  const centre = 'M200 300V70L280 40V300Z';
  const slantY = (x) => 70 - ((x - 200) * 30) / 80;
  let centreGrid = range(82, 290, 12).map((y) => `M200 ${y}H280`).join('');
  centreGrid += range(216, 264, 16).map((x) => `M${x} ${slantY(x)}V300`).join('');
  for (const y of range(82, 278, 12)) for (const x of range(200, 264, 16)) maybeLight(x, y, 16, 12);

  // Left tower
  let leftGrid = range(144, 290, 14).map((y) => `M100 ${y}H180`).join('');
  leftGrid += range(120, 160, 20).map((x) => `M${x} 130V300`).join('');
  for (const y of range(130, 270, 14)) for (const x of range(100, 160, 20)) maybeLight(x, y, 20, 14);

  // Right tower — stepped
  const right = 'M300 300V110H350V140H380V300Z';
  let rightGrid = range(124, 290, 14).map((y) => `M300 ${y}H${y < 140 ? 350 : 380}`).join('');
  rightGrid += range(316, 364, 16).map((x) => `M${x} ${x < 350 ? 110 : 140}V300`).join('');
  for (const y of range(140, 270, 14)) for (const x of range(300, 364, 16)) maybeLight(x, y, 16, 14);

  const fills =
    F(centre, '', glass) +
    FR(100, 130, 80, 170, '', glass) +
    FR(110, 118, 60, 12, 'f--dark') +
    F(right, '', glass) +
    FR(80, 266, 320, 34, 'f--dark');

  const trees = [70, 92, 410]
    .map((x) => `<g class="sway">${L(`M${x} 300V284`)}${`<circle class="l l--soft" cx="${x}" cy="276" r="10" pathLength="1"/>`}</g>`)
    .join('');

  return frame(
    'commercial',
    glassGradient('g-commercial'),
    fills +
      lights +
      ground() +
      L(centre, 'l--thick') +
      L(centreGrid, 'l--soft') +
      L('M240 55V18') +
      `<circle class="beacon" cx="240" cy="16" r="3"/>` +
      R(100, 130, 80, 170, 'l--thick') +
      R(110, 118, 60, 12) +
      L(leftGrid, 'l--soft') +
      L(right, 'l--thick') +
      L(rightGrid, 'l--soft') +
      R(80, 266, 320, 34) +
      L('M216 266v-8h48v8', 'l--accent') +
      trees +
      dimH(100, 380, 322, 'C-02 · TOWERS A–C') +
      dimV(420, 40, 300, '+186.0'),
  );
}
