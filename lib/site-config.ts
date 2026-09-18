// Central place for brand facts and contact details used across the site.
// The fallback only applies if NEXT_PUBLIC_SITE_URL is unset. It feeds
// metadataBase, every canonical and OG URL, sitemap.xml and robots.txt, so it
// must be a domain we actually own.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://hightunis-xi.vercel.app";

export const SITE_CONFIG = {
  name: "HighTunis",
  tagline: "Tunisia's Luxury",
  description: "Luxury stays, curated experiences, unforgettable moments.",
  foundedYear: 2024,
  headquarters: {
    line1: "Sidi Bou Said",
    line2: "Tunis, Tunisia",
  },
  emails: {
    hello: "hello@hightunis.com",
    concierge: "concierge@hightunis.com",
    partners: "partners@hightunis.com",
    press: "press@hightunis.com",
  },
  social: {
    instagram: "https://instagram.com/hightunis",
    tiktok: "https://tiktok.com/@hightunis",
    linkedin: "https://linkedin.com/company/hightunis",
  },
} as const;
