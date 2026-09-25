import { SITE_CONFIG } from "./site-config";

/**
 * OpenGraph defaults, shared because Next REPLACES the whole `openGraph`
 * object when a nested segment defines one rather than deep-merging it. Any
 * page that sets its own openGraph must spread these back in or it silently
 * loses siteName, type and the share image.
 */
export const OG_DEFAULTS = {
  siteName: SITE_CONFIG.name,
  type: "website" as const,
  images: [
    {
      url: "/og.jpg",
      width: 1200,
      height: 630,
      alt: `${SITE_CONFIG.name}: the view over Sidi Bou Said`,
    },
  ],
};

/**
 * Twitter reads its own tags and falls back to OpenGraph for the rest.
 * summary_large_image is the 1.91:1 card; plain `summary` renders a small
 * square and crops the wordmark out of it.
 */
export const TWITTER_DEFAULTS = {
  card: "summary_large_image" as const,
};
