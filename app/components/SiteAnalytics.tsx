"use client";

import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";

/**
 * Vercel Web Analytics, with the admin excluded.
 *
 * This wrapper exists for one reason: beforeSend is a function, and a function
 * cannot cross the server/client boundary as a prop. The root layout is a
 * server component, so <Analytics beforeSend={...} /> cannot be written there
 * directly.
 *
 * WHY NO CSP CHANGE IS NEEDED, in production.
 *   The script is served from /_vercel/insights/script.js and the beacon is
 *   posted to /_vercel/insights/*, both on our own origin: Vercel's edge
 *   proxies them rather than the browser talking to a Vercel domain. So
 *   script-src 'self' and connect-src 'self' already cover it, and neither has
 *   to be loosened. Verified by reading getScriptSrc() in the installed
 *   package rather than taking the documentation's word for it.
 *
 *   In local development the package deliberately loads a different file, from
 *   https://va.vercel-scripts.com, which our CSP does block. That is why this
 *   only renders in production: the /_vercel/* endpoints exist only on Vercel,
 *   so analytics could never work locally anyway, and rendering it would just
 *   print a CSP violation in the dev console every reload. Preview deployments
 *   build with NODE_ENV=production, so they still report.
 */
const isAdmin = (path: string) => path === "/admin" || path.startsWith("/admin/");

export default function SiteAnalytics() {
  const pathname = usePathname();

  if (process.env.NODE_ENV !== "production") return null;

  // Two layers, deliberately. This one stops the script being injected at all
  // on an admin page loaded directly. The beforeSend below covers the other
  // case: arriving at the admin from a public page, where the script tag is
  // already in the document and cannot be taken back.
  if (isAdmin(pathname)) return null;

  return (
    <Analytics
      beforeSend={(event) => {
        // The admin is a private tool behind a password. Its page views are
        // not audience data and should never leave the browser. Returning null
        // drops the event before it is sent.
        if (isAdmin(new URL(event.url).pathname)) return null;
        return event;
      }}
    />
  );
}
