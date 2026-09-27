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
 *   Both the script and the beacon are served from our own origin, so
 *   script-src 'self' and connect-src 'self' already cover them and neither
 *   has to be loosened. The browser never contacts a Vercel domain.
 *
 *   The paths are not the documented /_vercel/insights/* in practice. Version
 *   2 of the package has what Vercel calls Resilient Intake: a random seed
 *   generated at build time becomes the path, so this deployment serves
 *   /de7e265292cd815d/script.js and posts views to /de7e265292cd815d/view,
 *   and the next deployment will use a different prefix. The point of that is
 *   to be harder for ad blockers to pattern-match. It stays first-party, so
 *   the CSP is unaffected either way.
 *
 *   Confirmed against the live site, not assumed: on a public page the only
 *   non-Next requests are the logo, that script and that view beacon, with
 *   zero third-party origins and zero cookies, localStorage or sessionStorage.
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
