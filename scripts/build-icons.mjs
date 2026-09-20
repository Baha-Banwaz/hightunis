// Builds the favicon set and the navbar logos from Black.svg.
//
// Run with: node scripts/build-icons.mjs
//
// Black.svg is a faithful potrace vector of the mark: its path bounding box
// matches the PNG's measured ink to within a pixel. Everything here derives
// from it, so there is one source of truth for the glyph.
//
// The mark is cropped tight, optically centred, and set on an OPAQUE BLACK
// tile with the glyph knocked out in white. Opaque because only the SVG
// favicon can respond to prefers-color-scheme, while .ico, apple-touch-icon
// and the manifest icons cannot, and those are what bookmarks, history, the
// iOS home screen and share sheets actually use. iOS also composites black
// behind transparency, so a transparent mark would be black-on-black there.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import sharp from "sharp";

const SRC = "Black.svg";
/** Glyph width as a fraction of the tile. 0.80 leaves a 10% margin each side. */
const FILL = 0.80;
/** Work large, downscale with proper filtering. */
const MASTER = 1024;

// --- 1. Pull the paths and measure the glyph -------------------------------

const svg = readFileSync(SRC, "utf8");
const paths = [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]);
if (paths.length !== 2) throw new Error(`expected 2 paths in ${SRC}, found ${paths.length}`);

function pathBBox(ds) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const d of ds) {
    const toks = d.match(/[a-zA-Z]|-?\d*\.?\d+/g);
    let i = 0, cx = 0, cy = 0, cmd = "", sx = 0, sy = 0;
    const put = (x, y) => {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    };
    while (i < toks.length) {
      if (/[a-zA-Z]/.test(toks[i])) cmd = toks[i++];
      const n = () => parseFloat(toks[i++]);
      if (cmd === "M" || cmd === "m") {
        const x = n(), y = n();
        cx = cmd === "M" ? x : cx + x; cy = cmd === "M" ? y : cy + y;
        sx = cx; sy = cy; put(cx, cy); cmd = cmd === "M" ? "L" : "l";
      } else if (cmd === "L" || cmd === "l") {
        const x = n(), y = n(); cx = cmd === "L" ? x : cx + x; cy = cmd === "L" ? y : cy + y; put(cx, cy);
      } else if (cmd === "H" || cmd === "h") { const x = n(); cx = cmd === "H" ? x : cx + x; put(cx, cy); }
      else if (cmd === "V" || cmd === "v") { const y = n(); cy = cmd === "V" ? y : cy + y; put(cx, cy); }
      else if (cmd === "C" || cmd === "c") {
        const a = n(), b = n(), c = n(), e = n(), f = n(), g = n(), rel = cmd === "c";
        put(rel ? cx + a : a, rel ? cy + b : b);
        put(rel ? cx + c : c, rel ? cy + e : e);
        const nx = rel ? cx + f : f, ny = rel ? cy + g : g;
        put(nx, ny); cx = nx; cy = ny;
      } else if (cmd === "Z" || cmd === "z") { cx = sx; cy = sy; i++; }
      else i++;
    }
  }
  return { minX, minY, maxX, maxY };
}

// Black.svg's own transform: translate(0,1280) scale(0.1,-0.1)
const PS = 0.1, PH = 1280;
const bb = pathBBox(paths);
const gx0 = bb.minX * PS, gx1 = bb.maxX * PS;
const gy0 = PH - bb.maxY * PS, gy1 = PH - bb.minY * PS;
const gw = gx1 - gx0, gh = gy1 - gy0;

// --- 2. Compose the tile ---------------------------------------------------

/** Glyph scaled to FILL of the tile width, then centred on both axes. */
function tileSvg(size, { glyph = "#ffffff", bg = "#000000", transparent = false } = {}) {
  const k = (FILL * size) / gw;
  const tx = (size - gw * k) / 2;
  const ty = (size - gh * k) / 2; // optical centring: the 2.6% right offset is dropped
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
${transparent ? "" : `  <rect width="${size}" height="${size}" fill="${bg}"/>\n`}  <g transform="translate(${tx.toFixed(3)},${ty.toFixed(3)}) scale(${k.toFixed(6)}) translate(${(-gx0).toFixed(3)},${(-gy0).toFixed(3)})">
    <g transform="translate(0,${PH}) scale(${PS},-${PS})" fill="${glyph}">
${paths.map((d) => `      <path d="${d}"/>`).join("\n")}
    </g>
  </g>
</svg>
`;
}

/** The bare mark with no tile, for the navbar. Cropped tight, no padding. */
function markSvg(fill) {
  const pad = 0; // navbar sizing is done in CSS; the asset is the glyph itself
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${gw.toFixed(2)} ${gh.toFixed(2)}" role="img" aria-label="HighTunis">
  <g transform="translate(${(-gx0 + pad).toFixed(3)},${(-gy0 + pad).toFixed(3)})">
    <g transform="translate(0,${PH}) scale(${PS},-${PS})" fill="${fill}">
${paths.map((d) => `      <path d="${d}"/>`).join("\n")}
    </g>
  </g>
</svg>
`;
}

// --- 3. Emit ---------------------------------------------------------------

mkdirSync("public/icons", { recursive: true });

const master = Buffer.from(tileSvg(MASTER));
const render = (size) =>
  sharp(master, { density: 384 }).resize(size, size, { kernel: "lanczos3" }).png({ compressionLevel: 9 }).toBuffer();

const ICO_SIZES = [16, 32, 48];
const PNG_TARGETS = [
  ["public/apple-touch-icon.png", 180],
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-512.png", 512],
];

const icoBufs = [];
for (const s of ICO_SIZES) icoBufs.push([s, await render(s)]);
for (const [file, size] of PNG_TARGETS) {
  writeFileSync(file, await render(size));
  console.log(`  ${file.padEnd(32)} ${size}x${size}`);
}

// ICO container: 6-byte header, 16 bytes per entry, then the PNG payloads.
// PNG-in-ICO is understood by every browser in use.
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);          // reserved
  header.writeUInt16LE(1, 2);          // 1 = icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  entries.forEach(([size, buf], i) => {
    const o = i * 16;
    dir[o] = size >= 256 ? 0 : size;   // 0 means 256
    dir[o + 1] = size >= 256 ? 0 : size;
    dir[o + 2] = 0;                    // palette count
    dir[o + 3] = 0;                    // reserved
    dir.writeUInt16LE(1, o + 4);       // colour planes
    dir.writeUInt16LE(32, o + 6);      // bits per pixel
    dir.writeUInt32LE(buf.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += buf.length;
  });

  return Buffer.concat([header, dir, ...entries.map(([, b]) => b)]);
}

const ico = buildIco(icoBufs);
writeFileSync("app/favicon.ico", ico);
console.log(`  ${"app/favicon.ico".padEnd(32)} ${ICO_SIZES.join("/")}  ${ico.length} bytes`);

writeFileSync("public/icons/icon.svg", tileSvg(512));
writeFileSync("public/Black.svg", markSvg("#000000"));
writeFileSync("public/White.svg", markSvg("#ffffff"));
console.log(`  ${"public/icons/icon.svg".padEnd(32)} vector tile`);
console.log(`  ${"public/Black.svg".padEnd(32)} navbar mark, black`);
console.log(`  ${"public/White.svg".padEnd(32)} navbar mark, white`);

console.log(`\n  glyph bbox   ${gw.toFixed(1)} x ${gh.toFixed(1)}  (aspect ${(gw / gh).toFixed(3)}:1)`);
console.log(`  tile fill    ${(FILL * 100).toFixed(0)}% of width, centred on both axes`);
