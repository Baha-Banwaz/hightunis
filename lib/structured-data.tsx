import { SITE_CONFIG, SITE_URL } from "./site-config";

/**
 * JSON-LD. Every value here is either a verified fact from the site or is
 * absent. Nothing is guessed: a wrong address in structured data is worse
 * than none, because search engines will publish it.
 *
 * TODO_CONTENT_NEEDED markers sit beside the fields that are missing. They are
 * comments, not emitted values, so the markup stays valid.
 */

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Values come from our own config and database, never from user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * LocalBusiness. Deliberately incomplete.
 *
 * TODO_CONTENT_NEEDED: registered legal entity name, for `legalName`.
 * TODO_CONTENT_NEEDED: street address and postcode in Mahdia, for
 *   `address.streetAddress` and `postalCode`. NOT emitted until supplied:
 *   an invented address is the one error here that cannot be quietly undone.
 * TODO_CONTENT_NEEDED: telephone number, for `telephone`. The site publishes
 *   none anywhere.
 * TODO_CONTENT_NEEDED: opening hours, for `openingHoursSpecification`.
 * TODO_CONTENT_NEEDED: geo coordinates, for `geo`.
 * TODO_CONTENT_NEEDED: confirmation that hello@hightunis.com is monitored,
 *   before `email` is trusted by anyone acting on it.
 */
export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#business`,
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_URL,
    email: SITE_CONFIG.emails.hello,
    foundingDate: String(SITE_CONFIG.foundedYear),
    image: `${SITE_URL}/og.jpg`,
    logo: `${SITE_URL}/icons/icon-512.png`,
    sameAs: [SITE_CONFIG.social.instagram, SITE_CONFIG.social.tiktok, SITE_CONFIG.social.linkedin],
    // Only the country and region are asserted, because only those are known.
    address: {
      "@type": "PostalAddress",
      addressLocality: SITE_CONFIG.headquarters.line1,
      addressCountry: "TN",
    },
    areaServed: { "@type": "Country", name: "Tunisia" },
  };
}

export function breadcrumbSchema(trail: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.href === "/" ? "" : c.href}`,
    })),
  };
}

export function articleSchema(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image?: string | null;
  published_at?: string | null;
  created_at?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover_image ?? `${SITE_URL}/og.jpg`,
    datePublished: post.published_at ?? post.created_at ?? undefined,
    dateModified: post.published_at ?? post.created_at ?? undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${post.slug}` },
    // TODO_CONTENT_NEEDED: a named author. Posts carry no author column, so
    // the organisation is credited rather than inventing a person.
    author: { "@type": "Organization", name: SITE_CONFIG.name, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icons/icon-512.png` },
    },
  };
}
