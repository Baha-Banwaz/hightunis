// Produces the optimised hero and the social share card from the original
// photograph. Run with: node scripts/build-hero-assets.mjs
//
// The source shipped as public/hero.jpg but was actually a 5504x3072 PNG,
// 34MB, serving as the LCP image on every homepage visit AND as the only
// candidate for a share card.
//
// This script is destructive: it overwrites its own source. It refuses to run
// on an already-processed file so a second run cannot re-encode a JPEG from a
// JPEG and lose quality each time. To rerun from scratch:
//     git checkout <commit-before-this>~1 -- public/hero.jpg

import { readFileSync, writeFileSync, statSync } from "node:fs";
import sharp from "sharp";

const SRC = "public/hero.jpg";
const MIN_SOURCE_BYTES = 5_000_000;

const size = statSync(SRC).size;
if (size < MIN_SOURCE_BYTES) {
  console.error(`Refusing to run: ${SRC} is ${(size / 1e6).toFixed(1)}MB, so it has`);
  console.error("already been processed. Restore the original from git first.");
  process.exit(1);
}

const src = readFileSync(SRC);
const meta = await sharp(src).metadata();
console.log(`  source: ${meta.width}x${meta.height} ${meta.format}, ${(size / 1e6).toFixed(1)}MB\n`);

// --- 1. The hero itself -----------------------------------------------------
// 2560 wide covers a 2x 1280 viewport, which is the widest realistic case for
// a full-bleed background. Beyond that the file grows for pixels nobody
// resolves. mozjpeg at 80 because this is a photograph, not a graphic.
const HERO_WIDTH = 2560;
const hero = await sharp(src)
  .resize({ width: HERO_WIDTH, withoutEnlargement: true })
  .jpeg({ quality: 80, mozjpeg: true, progressive: true })
  .toBuffer();

// --- 2. The share card ------------------------------------------------------
// 1200x630 is the 1.91:1 that Slack, WhatsApp, iMessage, Twitter and Facebook
// all crop to. The source is 1.79:1, so height is trimmed, not width.
const OG_W = 1200, OG_H = 630;

// Matching the live hero: the wordmark spans ~71% of the viewport width.
// The measured ratio for Arial Black at this tracking is 5.938 units of width
// per unit of font-size, so 1200 * 0.71 / 5.938 gives the size.
const WORDMARK_FRACTION = 0.71;
const FONT_SIZE = Math.round((OG_W * WORDMARK_FRACTION) / 5.938);

const photo = await sharp(src)
  .resize(OG_W, OG_H, { fit: "cover", position: "centre" })
  .toBuffer();

const wordmark = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}">
    <defs>
      <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#000" stop-opacity="0"/>
        <stop offset="45%" stop-color="#000" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="${OG_W}" height="${OG_H}" fill="url(#scrim)"/>
    <text x="${OG_W / 2}" y="${OG_H / 2}"
          text-anchor="middle" dominant-baseline="central"
          font-family="Arial Black, Arial, Helvetica, sans-serif"
          font-weight="900" font-size="${FONT_SIZE}"
          letter-spacing="${(-0.05 * FONT_SIZE).toFixed(2)}"
          fill="#ffffff">HIGHTUNIS</text>
  </svg>`
);

const og = await sharp(photo)
  .composite([{ input: wordmark, top: 0, left: 0 }])
  .jpeg({ quality: 82, mozjpeg: true, progressive: true })
  .toBuffer();

writeFileSync(SRC, hero);
writeFileSync("public/og.jpg", og);

const heroMeta = await sharp(hero).metadata();
console.log(`  hero  -> ${heroMeta.width}x${heroMeta.height} jpeg  ${(hero.length / 1e6).toFixed(2)}MB  (was ${(size / 1e6).toFixed(1)}MB)`);
console.log(`  og    -> ${OG_W}x${OG_H} jpeg  ${(og.length / 1024).toFixed(0)}KB  wordmark font ${FONT_SIZE}px`);
console.log(`\n  reduction: ${(100 - (hero.length / size) * 100).toFixed(1)}%`);
