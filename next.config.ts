import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Narrow the Supabase image host to this project when the URL is configured.
// Falls back to the wildcard so a missing env var cannot break image loading.
const supabaseHostname = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return "*.supabase.co";
  }
})();

const supabaseOrigin =
  supabaseHostname === "*.supabase.co"
    ? "https://*.supabase.co"
    : `https://${supabaseHostname}`;

/**
 * Static Content-Security-Policy.
 *
 * `script-src` needs 'unsafe-inline' because Next.js App Router streams the
 * RSC payload through inline <script> tags. Removing it requires a per-request
 * nonce set in proxy.ts, which forces every page to render dynamically and
 * would give up the ISR caching this site relies on. 'unsafe-eval' is dev-only
 * (React uses eval for debug stack reconstruction); production never gets it.
 *
 * `style-src` needs 'unsafe-inline' for next/font's injected <style> block and
 * for the inline style attributes Framer Motion writes on every animated node.
 */
const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'none'`,
  `frame-src 'none'`,
  `form-action 'self'`,
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://images.unsplash.com ${supabaseOrigin}`,
  `font-src 'self' data:`,
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  `media-src 'self'`,
  `worker-src 'self' blob:`,
  `manifest-src 'self'`,
  ...(isDev ? [] : [`upgrade-insecure-requests`]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(), picture-in-picture=(), publickey-credentials-get=(), screen-wake-lock=(), usb=(), xr-spatial-tracking=()",
  },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HSTS is production-only: sending it from `next dev` pins localhost to
  // https in the browser and is a nuisance to undo.
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          // `preload` is deliberately omitted - it is a hard-to-reverse
          // commitment. Add it once the domain has run with this for a while.
          value: "max-age=63072000; includeSubDomains",
        },
      ]),
];

const nextConfig: NextConfig = {
  // Do not ship browser source maps to production (this is also the default;
  // set explicitly so it cannot be turned on by accident).
  productionBrowserSourceMaps: false,
  // Stop advertising the framework in every response.
  poweredByHeader: false,
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Admin pages and every API response: never cached, never indexed.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
