import { F, FR, L, R, dimH, dimV, frame, ground, lit, range, rng } from './helpers.js';

export default function industrial() {
  const rand = rng(11);
  const hall = 'M40 300V170L85 132V170L130 132V170L175 132V170L220 132V170L265 132V170L300 170V300Z';

  const fills = [
    F(hall),
    FR(318, 70, 20, 230, 'f--dark'),
    FR(348, 110, 16, 190, 'f--dark'),
    F('M385 300V170L403 150L421 170V300Z'),
    F('M428 300V185L446 165L464 185V300Z'),
  ].join('');

  // Roof glazing in each sawtooth
  const glazing = range(0, 5, 1)
    .map((i) => {
      const x = 85 + i * 45;
      return i < 5 ? `M${x - 4} 136V170` : '';
    })
    .join('');

  // Ribbon windows
  const windows = range(52, 280, 30)
    .map((x) => R(x, 188, 20, 16))
    .join('');
  const lights = range(52, 280, 30)
    .filter(() => rand() > 0.45)
    .map((x, i) => lit(x + 1, 189, 18, 14, i * 0.7))
    .join('');

  const doors = [60, 132, 204]
    .map((x) => R(x, 236, 46, 64) + L(range(244, 292, 8).map((y) => `M${x} ${y}h46`).join(''), 'l--soft'))
    .join('');

  const chimneys =
    R(318, 70, 20, 230) +
    L('M318 82h20M318 92h20', 'l--accent') +
    R(348, 110, 16, 190) +
    L('M348 120h16M348 128h16', 'l--accent');

  const smoke = [
    [328, 60, 0], [328, 60, 1.6], [328, 60, 3.2],
    [356, 100, 0.8], [356, 100, 2.4], [356, 100, 4],
  ]
    .map(([x, y, d]) => `<circle class="smoke" cx="${x}" cy="${y}" r="7" style="--d:${d}s"/>`)
    .join('');

  const silos =
    L('M385 300V170L403 150L421 170V300M385 170h36') +
    L(range(190, 290, 20).map((y) => `M385 ${y}h36`).join(''), 'l--soft') +
    L('M428 300V185L446 165L464 185V300M428 185h36') +
    L(range(205, 290, 20).map((y) => `M428 ${y}h36`).join(''), 'l--soft') +
    L('M403 150V140M446 165V155', 'l--accent');

  const pipes = L('M300 206H385M300 214H385') + L('M320 214V300M360 214V300', 'l--soft');

  return frame(
    'industrial',
    '',
    fills +
      ground() +
      L(hall, 'l--thick') +
      L(glazing, 'l--soft') +
      windows +
      lights +
      doors +
      chimneys +
      silos +
      pipes +
      smoke +
      dimH(40, 300, 322, 'I-01 · 78.00 M') +
      dimV(22, 132, 300, '+12.4'),
  );
}
