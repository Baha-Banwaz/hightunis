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
  logo?: { src: string; width: number; height: number };
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
// to be shown. Logo files to follow; until then each shows as its name.
export const PARTNERS: Partner[] = [
  { name: "Four Seasons Hotel Tunis" },
  { name: "The Residence Tunis" },
  { name: "Anantara Tozeur Resort" },
  { name: "La Badira" },
  { name: "Villa Didon" },
  { name: "Dar Said" },
  { name: "Dar El Marsa" },
  { name: "Hasdrubal Prestige Djerba" },
  { name: "Mövenpick Hotel Gammarth" },
];

/**
 * A slow, continuous row of partner logos. The list is drawn twice and the
 * track slides left by exactly one copy, so the loop has no visible seam.
 * It pauses on hover, and stands still, wrapped and centred, for visitors who
 * prefer reduced motion. Logos are shown in greyscale so no single brand's
 * colours compete with the page.
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
    <section aria-labelledby="partners-heading" className="bg-white pt-16 pb-4 md:pt-24 md:pb-8">
      <h2 id="partners-heading" className="px-6 lg:px-12 mx-auto max-w-[1180px] box-content text-sm md:text-base text-black/60 mb-10 md:mb-12">
        Some of the houses and hotels we work with
      </h2>

      <div className="partner-marquee relative overflow-hidden">
        <ul
          className="partner-track flex w-max items-center"
          style={{ animationDuration: `${duration}s` }}
        >
          {[0, 1].map((copy) =>
            items.map((partner) => (
              <li
                key={`${copy}-${partner.name}`}
                aria-hidden={copy === 1 ? true : undefined}
                data-copy={copy}
                className="flex shrink-0 items-center justify-center px-8 md:px-14"
              >
                {partner.logo ? (
                  <Image
                    src={partner.logo.src}
                    alt={copy === 0 ? partner.name : ""}
                    width={partner.logo.width}
                    height={partner.logo.height}
                    className="h-8 md:h-11 w-auto max-w-[160px] md:max-w-[200px] object-contain grayscale opacity-70"
                  />
                ) : (
                  <span className="whitespace-nowrap text-xl md:text-2xl font-medium tracking-[-0.02em] text-black/70">
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
