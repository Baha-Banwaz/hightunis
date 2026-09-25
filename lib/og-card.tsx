import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * The shared social card, drawn from the site's own typography and palette:
 * black ground, DM Sans, the #A8874E accent, the ht mark. No stock imagery.
 *
 * Pages that own a real photograph do NOT use this: the property and blog
 * pages share their own image, and the home page shares the hero. A generated
 * card is the right answer when there is nothing better to show, not a
 * replacement for a photograph that exists.
 *
 * DM Sans is vendored at assets/DMSans-Bold.ttf because Satori, which backs
 * ImageResponse, has no system fonts and cannot read the woff2 that next/font
 * leaves behind. It is OFL licensed, so redistributing it here is fine.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const ACCENT = "#A8874E";

let fontCache: Buffer | null = null;
async function dmSans() {
  if (!fontCache) fontCache = await readFile(join(process.cwd(), "assets/DMSans-Bold.ttf"));
  return fontCache;
}

export async function ogCard({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  const font = await dmSans();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000000",
          padding: "68px 76px",
          fontFamily: "DM Sans",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="52" height="46" viewBox="0 0 582.7 508.5">
            <g transform="translate(-383,-385)">
              <g transform="translate(0,1280) scale(0.1,-0.1)" fill="#ffffff">
                <path d="M3830 6435 l0 -2515 605 2 605 3 3 935 3 935 31 155 c51 258 87 375 158 525 63 131 123 202 205 239 119 54 194 42 251 -40 69 -101 64 11 67 -1441 l3 -1313 609 0 610 0 0 1023 c-1 1179 -7 1370 -43 1502 -65 235 -190 413 -363 518 -181 108 -492 144 -757 87 -117 -25 -166 -45 -255 -103 -142 -93 -240 -209 -337 -397 -87 -170 -136 -334 -170 -569 -10 -71 -13 170 -14 1435 l-1 1521 -46 7 c-26 3 -298 6 -605 6 l-559 0 0 -2515z" />
                <path d="M8648 7819 c-252 -101 -622 -157 -973 -147 l-110 3 -5 -320 -5 -320 -228 -1 c-125 -1 -231 -5 -235 -8 -3 -4 -1 -15 4 -24 10 -15 37 -17 235 -20 l224 -2 -1 -508 c0 -279 3 -838 6 -1242 l7 -735 27 -90 c71 -233 223 -410 406 -470 197 -64 230 -69 460 -69 184 -1 231 2 325 21 279 57 470 156 635 330 120 125 208 279 226 394 11 68 -14 44 -56 -54 -93 -214 -231 -373 -399 -459 -183 -93 -353 -13 -396 188 -12 59 -15 266 -15 1382 l0 1312 319 0 c319 0 371 5 371 35 0 13 -43 15 -345 15 l-345 0 -1 28 c0 15 0 201 1 415 1 369 1 387 -17 386 -10 -1 -62 -19 -115 -40z" />
              </g>
            </g>
          </svg>
          <div style={{ fontSize: 24, letterSpacing: "0.32em", color: ACCENT }}>HIGHTUNIS</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: title.length > 26 ? 78 : 104,
              color: "#ffffff",
              letterSpacing: "-0.04em",
              lineHeight: 1.02,
              textTransform: "uppercase",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 29,
              color: "rgba(255,255,255,0.62)",
              marginTop: 26,
              lineHeight: 1.35,
              maxWidth: 940,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `3px solid ${ACCENT}`,
            paddingTop: 26,
            fontSize: 20,
            letterSpacing: "0.26em",
            color: "rgba(255,255,255,0.55)",
          }}
        >
          <div style={{ display: "flex" }}>{eyebrow.toUpperCase()}</div>
          <div style={{ display: "flex" }}>WWW.HIGHTUNIS.COM</div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: "DM Sans", data: font as unknown as ArrayBuffer, weight: 700, style: "normal" }],
    }
  );
}
