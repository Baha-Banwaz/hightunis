import Image from "next/image";
import { ContentTodo } from "./ContentTodo";

export interface Partner {
  /** The brand's name as it writes it. Read out to screen readers. */
  name: string;
  /**
   * The brand's own logo file, placed in /public/partners/. Prefer SVG; a PNG
   * with a transparent background also works. Width and height are the file's
   * own pixel size, so the browser can reserve the space before it loads.
   * Leave it out and the name is shown as text in its place.
   */
  logo?: {
    src: string;
    width: number;
    height: number;
    /**
     * How the logo is flattened to match the others. "dark" (the default)
     * turns every coloured pixel black, which suits outline and white logos.
     * "grey" keeps the logo's shading and only removes its colour; use it for
     * logos with filled shapes, which would otherwise become solid blobs.
     * "soft" removes colour without darkening, for logos whose detail sits
     * inside a filled shape and would vanish if it were darkened.
     */
    tone?: "dark" | "grey" | "soft";
    /** A square or emblem-style logo that needs more height to be legible. */
    tall?: boolean;
  };
}

/**
 * TODO_CONTENT_NEEDED
 *
 * Real partners only. A logo here tells every visitor "we work with this
 * brand", so each one needs:
 *   - an actual working relationship (a listing, a referral agreement, a
 *     project delivered together), and
 *   - the brand's permission to show its logo, ideally in writing, with the
 *     logo file they supplied rather than one copied from their website.
 *
 * No placeholder brands are written here on purpose: naming a hotel or house
 * we do not work with is the same false reference CaseStudies.tsx refuses,
 * and it is a trademark problem as well as a trust one.
 *
 * Fill this array and the slider appears under the homepage statement. Leave
 * it empty and nothing renders on the live site.
 */
// Confirmed by the owner, through their lawyer, that each brand below agreed
// to be shown. Logos were taken from each hotel's own website where it allowed
// it; Four Seasons came from Wikipedia, Mövenpick from worldvectorlogo.com and
// Anantara from logowik.com (its pre-2024 "Hotels, Resorts, Spas" version).
// Swap in the official files whenever the hotels supply them. Dar El Marsa's
// logo was supplied by the owner as a JPG; its white background was removed.
export const PARTNERS: Partner[] = [
  { name: "Four Seasons Hotel Tunis", logo: { src: "/partners/four-seasons.svg", width: 221, height: 103 } },
  { name: "The Residence Tunis", logo: { src: "/partners/the-residence-tunis.svg", width: 162, height: 76 } },
  { name: "Anantara Tozeur Resort", logo: { src: "/partners/anantara.webp", width: 685, height: 341 } },
  { name: "La Badira", logo: { src: "/partners/la-badira.webp", width: 170, height: 58 } },
  { name: "Villa Didon", logo: { src: "/partners/villa-didon.svg", width: 738, height: 153 } },
  { name: "Dar Said", logo: { src: "/partners/dar-said.svg", width: 267, height: 261, tone: "grey", tall: true } },
  { name: "Dar El Marsa", logo: { src: "/partners/dar-el-marsa.webp", width: 576, height: 348, tone: "soft", tall: true } },
  { name: "Hasdrubal Prestige Djerba", logo: { src: "/partners/hasdrubal-prestige.webp", width: 300, height: 70, tone: "grey" } },
  { name: "Mövenpick Hotel Gammarth", logo: { src: "/partners/movenpick.svg", width: 704, height: 250 } },
];

/**
 * A slow, continuous row of partner logos. The list is drawn twice and the
 * track slides left by exactly one copy, so the loop has no visible seam.
 * It stands still, wrapped and centred, for visitors who prefer reduced
 * motion. Logos are flattened to black or grey so no single
 * brand's colours compete with the page.
 */
export default function PartnerLogos({ items = PARTNERS }: { items?: Partner[] }) {
  if (items.length === 0) {
    return (
      <div className="px-6 lg:px-12 py-8">
        <ContentTodo>
          Partner logo slider is built and wired up under the homepage
          statement, waiting on real partners. Fill PARTNERS in
          app/components/PartnerLogos.tsx (logo files in /public/partners/)
          and it appears. Deliberately left empty: listing brands we do not
          actually work with would be a false claim to every visitor.
        </ContentTodo>
      </div>
    );
  }

  // Seconds per full loop. Scales with the list so the speed stays the same
  // however many partners there are.
  const duration = Math.max(items.length * 4, 24);

  return (
    <section aria-label="Partner hotels" className="bg-white pt-14 pb-4 md:pt-20 md:pb-8">

      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)] motion-reduce:[mask-image:none]">
        <ul
          className="flex w-max items-center animate-partner-scroll motion-reduce:animate-none motion-reduce:w-auto motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-8"
          style={{ animationDuration: `${duration}s` }}
        >
          {[0, 1].map((copy) =>
            items.map((partner) => (
              <li
                key={`${copy}-${partner.name}`}
                aria-hidden={copy === 1 ? true : undefined}
                className={`flex shrink-0 items-center justify-center px-8 md:px-14 ${copy === 1 ? "motion-reduce:hidden" : ""}`}
              >
                {partner.logo ? (
                  <Image
                    src={partner.logo.src}
                    alt={copy === 0 ? partner.name : ""}
                    width={partner.logo.width}
                    height={partner.logo.height}
                    className={`${partner.logo.tall ? "h-16 md:h-20" : "h-9 md:h-12"} w-auto max-w-[170px] md:max-w-[220px] object-contain ${partner.logo.tone === "grey" ? "grayscale contrast-150 brightness-50 opacity-90" : partner.logo.tone === "soft" ? "grayscale opacity-90" : "brightness-0 opacity-70"}`}
                  />
                ) : (
                  <span className="whitespace-nowrap text-lg md:text-[1.35rem] font-normal tracking-[-0.01em] text-black/60">
                    {partner.name}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}
