"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
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
    };
  }, []);

  return <>{children}</>;
}
