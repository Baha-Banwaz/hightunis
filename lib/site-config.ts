// Central place for brand facts and contact details used across the site.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://high-tunis.vercel.app";

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
