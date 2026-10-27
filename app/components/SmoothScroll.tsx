"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

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
   * Go back to the top on navigation.
   *
   * Next already does this, and it was being undone. Lenis keeps its own idea
   * of the scroll position and writes it back on every frame, so a router
   * navigation that set scrollTop to 0 was immediately overwritten with
   * wherever the previous page had been left. Following a link from halfway
   * down one page dropped you halfway down the next.
   *
   * Lenis has to be told directly, and immediately: animating the jump would
   * show the new page sliding up from its middle, which is worse than the bug.
   * When reduced motion is on there is no Lenis instance, and the native
   * behaviour is already correct, so this only has to cover the fallback.
   *
   * A hash is left alone. Nothing links to one today, but scrolling to the top
   * is the wrong answer for an anchor, and this effect should not be the
   * reason that breaks later.
   */
  useEffect(() => {
    if (window.location.hash) return;

    const lenis = lenisRef.current;
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname]);

  return <>{children}</>;
}
