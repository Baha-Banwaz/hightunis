"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  /** Where each path was left, so Back can put you back. */
  const positions = useRef(new Map<string, number>());
  /** Set by popstate, so the next path change knows it was Back or Forward. */
  const cameFromHistory = useRef(false);
  useEffect(() => {
    // Lenis takes over the scroll wheel. Someone who has asked their operating
    // system to reduce motion has asked for exactly this not to happen, and
    // Lenis does not check on its own: a CSS media query cannot switch off a
    // JavaScript scroll hijacker. Without this the site overrides that
    // preference on every page, which for a vestibular disorder is the
    // difference between usable and not.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.2,
      touchMultiplier: 2,
    });
    lenisRef.current = lenis;

    let frame = 0;
    function raf(time: number) {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    }
    frame = requestAnimationFrame(raf);

    return () => {
      // The old cleanup destroyed Lenis but left the rAF loop running, so
      // every remount added another loop calling into a destroyed instance.
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  /**
   * Remember where the current page is, continuously.
   *
   * Keyed to pathname so React swaps the listener as you navigate. The order
   * matters and it works out: on a route change React runs this cleanup before
   * the reset effect below, so the outgoing page's position is already
   * recorded and the incoming page cannot overwrite it with a zero.
   *
   * Reading window.scrollY rather than a Lenis callback covers both cases in
   * one listener. Lenis scrolls the window, so window.scrollY follows it, and
   * when reduced motion is on there is no Lenis to ask.
   */
  useEffect(() => {
    const path = pathname;
    const lenis = lenisRef.current;
    const record = () =>
      positions.current.set(path, lenis ? lenis.scroll : window.scrollY);

    // Lenis has to be asked directly. It moves the page without emitting a
    // native scroll event, so a window listener alone recorded nothing and
    // Back always fell through to zero. The window listener stays for the
    // reduced-motion case, where there is no Lenis at all.
    if (lenis) lenis.on("scroll", record);
    window.addEventListener("scroll", record, { passive: true });

    // Deliberately not called on mount. On a Back navigation this effect runs
    // before the reset effect below, while the page still shows the outgoing
    // offset, so recording here overwrote the very position we were about to
    // restore: Back landed on the previous page's scroll instead of its own.
    return () => {
      if (lenis) lenis.off("scroll", record);
      window.removeEventListener("scroll", record);
    };
  }, [pathname]);

  /** popstate fires for Back and Forward, and for nothing else. */
  useEffect(() => {
    const onPop = () => {
      cameFromHistory.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /**
   * On navigation, go to the top. On Back or Forward, go back to where you
   * were.
   *
   * Next does both of these itself, and Lenis was undoing both. Lenis keeps
   * its own idea of the scroll position and writes it back every frame, so
   * whatever the router set was immediately overwritten with wherever the
   * previous page had been left. Following a link from halfway down one page
   * dropped you halfway down the next; the earlier fix for that forced the top
   * unconditionally, which then broke Back.
   *
   * Immediate rather than animated: animating would show the new page sliding
   * from the old page's offset, which looks worse than either bug.
   *
   * A hash is left alone. Nothing links to one today, but the top of the page
   * is the wrong answer for an anchor.
   */
  useEffect(() => {
    if (window.location.hash) return;

    const restoring = cameFromHistory.current;
    cameFromHistory.current = false;

    const target = restoring ? positions.current.get(pathname) ?? 0 : 0;

    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(target, { immediate: true });
    else window.scrollTo(0, target);
  }, [pathname]);

  return <>{children}</>;
}
