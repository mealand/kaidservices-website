/**
 * Generates PNG icons and the Open Graph share image from SVG sources.
 * Run with `npm run assets` after changing the logo or share artwork.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const pub = resolve(import.meta.dirname, '../public');
const favicon = await readFile(resolve(pub, 'favicon.svg'));

const icons = [
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
];
for (const [name, size] of icons) {
  await sharp(favicon, { density: 600 }).resize(size, size).png().toFile(resolve(pub, name));
  console.log('✓', name);
}

// Open Graph image (1200 × 630): blueprint grid, wireframe tower, headline.
const floors = Array.from({ length: 16 }, (_, i) => {
  const y = 560 - i * 28;
  const dx = Math.sin(i * 0.18) * 14;
  const hot = i === 15;
  return `<rect x="${830 + dx}" y="${y}" width="200" height="22" fill="${hot ? 'none' : '#0f1a26'}" stroke="${hot ? '#ff6a13' : '#a9c6dc'}" stroke-width="2"/>`;
}).join('');

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#8fb8d6" stroke-opacity=".1"/></pattern>
    <radialGradient id="glow" cx="78%" cy="40%" r="50%"><stop offset="0" stop-color="#ff6a13" stop-opacity=".18"/><stop offset="1" stop-color="#ff6a13" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0a0c0f"/>
  <rect width="1200" height="630" fill="url(#g)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  ${floors}
  <path d="M1080 582V90M1080 96H760M1080 96h70" stroke="#a9c6dc" stroke-width="2" fill="none"/>
  <path d="M880 96V170" stroke="#ff6a13" stroke-width="2"/>
  <path d="M60 582H1140" stroke="#8fb8d6" stroke-opacity=".4" stroke-width="2"/>
  <g transform="translate(70 70)" fill="none" stroke="#e8ecf0" stroke-width="4" stroke-linecap="square">
    <rect x="3" y="3" width="54" height="54"/><path d="M19 14v34M19 31l23-17M19 31l23 17"/>
  </g>
  <rect x="85" y="97" width="9" height="9" fill="#ff6a13"/>
  <text x="150" y="112" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="30" letter-spacing="4" fill="#e8ecf0">KAID SERVICES LIMITED</text>
  <text x="66" y="330" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="132" fill="#e8ecf0" letter-spacing="-4">WATCH</text>
  <text x="66" y="460" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="132" letter-spacing="-4" fill="#e8ecf0">IT <tspan fill="none" stroke="#ff6a13" stroke-width="3">RISE.</tspan></text>
  <text x="70" y="540" font-family="Courier New, monospace" font-size="24" letter-spacing="3" fill="#8a96a3">COMING SOON — KAIDSERVICES.COM</text>
</svg>`;

await sharp(Buffer.from(og)).png().toFile(resolve(pub, 'og-image.png'));
console.log('✓ og-image.png');
