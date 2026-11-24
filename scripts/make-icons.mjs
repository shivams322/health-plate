// Draws the Health Plate icon (a steel thali with four coloured katoris) and exports every size
// the website and the Android/iOS apps need. Run: npm run icons, then npm run assets.
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const webIcons = join(root, 'web', 'icons');
const assets = join(root, 'assets');
mkdirSync(webIcons, { recursive: true });
mkdirSync(assets, { recursive: true });

const BG = '#15110f';
const defs = `
  <radialGradient id="bg" cx="28%" cy="18%" r="105%"><stop offset="0" stop-color="#4a2a16"/><stop offset=".5" stop-color="#1e1512"/><stop offset="1" stop-color="#110d0b"/></radialGradient>
  <radialGradient id="steel" cx="34%" cy="28%" r="80%"><stop offset="0" stop-color="#b3aca4"/><stop offset=".5" stop-color="#67615b"/><stop offset="1" stop-color="#34302c"/></radialGradient>
  <radialGradient id="plate" cx="40%" cy="34%" r="78%"><stop offset="0" stop-color="#433c36"/><stop offset="1" stop-color="#1d1916"/></radialGradient>
  <radialGradient id="bowl" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#8a837c"/><stop offset="1" stop-color="#3c3733"/></radialGradient>`;

// Thali centred at (512,512) in a 1024 box, scaled by s.
function thali(s = 1) {
  const R = (v) => (v * s).toFixed(1);
  const at = (dx, dy) => [512 + dx * s, 512 + dy * s];
  const ring = (cx, cy, r, w, color, frac) => {
    const C = 2 * Math.PI * r;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2a2522" stroke-width="${w}"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"
        stroke-dasharray="${(C * frac).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`;
  };
  const katoris = [[-178, -178, '#e85d6c', .72], [178, -178, '#7d8cff', .62], [178, 178, '#e3b23c', .82], [-178, 178, '#2fbf8f', .68]]
    .map(([dx, dy, c, f]) => {
      const [x, y] = at(dx, dy);
      return `<circle cx="${x}" cy="${y}" r="${R(98)}" fill="url(#bowl)" stroke="#9c958e" stroke-width="${R(5)}"/>
        <circle cx="${x}" cy="${y}" r="${R(78)}" fill="#26211e"/>
        ${ring(x, y, R(60), R(22), c, f)}`;
    }).join('');
  return `<circle cx="512" cy="512" r="${R(372)}" fill="url(#steel)"/>
    <circle cx="512" cy="512" r="${R(336)}" fill="url(#plate)" stroke="#191512" stroke-width="${R(4)}"/>
    ${ring(512, 512, R(108), R(38), '#f08a3c', .78)}
    <circle cx="512" cy="512" r="${R(72)}" fill="#f08a3c" opacity=".16"/>
    ${katoris}`;
}
const svg = ({ bg = true, s = 1, size = 1024 } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024"><defs>${defs}</defs>
    ${bg ? '<rect width="1024" height="1024" fill="url(#bg)"/>' : ''}${thali(s)}</svg>`;

const png = (markup, size, file) => sharp(Buffer.from(markup)).resize(size, size).png().toFile(file);

// Website / PWA
writeFileSync(join(webIcons, 'icon.svg'), svg());
await png(svg(), 32, join(webIcons, 'favicon-32.png'));
await png(svg(), 180, join(webIcons, 'apple-touch-icon.png'));
await png(svg(), 192, join(webIcons, 'icon-192.png'));
await png(svg(), 512, join(webIcons, 'icon-512.png'));
await png(svg({ s: 0.86 }), 512, join(webIcons, 'maskable-512.png'));   // stays inside the maskable safe zone

// Native app sources for @capacitor/assets
await png(svg(), 1024, join(assets, 'icon-only.png'));
await png(svg({ bg: false, s: 0.62 }), 1024, join(assets, 'icon-foreground.png'));   // Android adaptive icon safe zone
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: BG } })
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><defs>${defs}</defs><rect width="1024" height="1024" fill="url(#bg)"/></svg>`) }])
  .png().toFile(join(assets, 'icon-background.png'));
const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732"><defs>${defs}</defs>
  <rect width="2732" height="2732" fill="${BG}"/><g transform="translate(1066 1066) scale(0.586)">${thali(1)}</g></svg>`;
await png(splash, 2732, join(assets, 'splash.png'));
await png(splash, 2732, join(assets, 'splash-dark.png'));
console.log('Icons written to web/icons and assets/');
