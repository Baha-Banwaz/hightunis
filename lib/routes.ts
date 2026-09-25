/**
 * Is this the home route, where a dark full-bleed hero sits behind a
 * transparent navbar?
 *
 * This is not just `pathname === "/"`. On Vercel the root page re-renders
 * under the internal path `/index`, so an exact match returned false on the
 * server and the white navbar was baked into the HTML, staying wrong until
 * the first client re-render. Same root cause as the /index canonical.
 *
 * FAILS OPEN TO THE HERO STATE. If the path is unknown, null or empty, this
 * returns true. The trade-off is deliberate: a transparent navbar on a white
 * page has low-contrast links, but a white bar slammed over the hero is the
 * failure people actually see, and it is the one page where first paint
 * matters most.
 */
const HOME_PATHS = new Set(["/", "/index", "/index.html"]);

export function isHomePath(pathname: string | null | undefined): boolean {
  if (pathname === null || pathname === undefined || pathname === "") return true;
  const trimmed = pathname.split("?")[0].split("#")[0];
  const normalised = trimmed.replace(/\/+$/, "") || "/";
  return HOME_PATHS.has(normalised);
}
