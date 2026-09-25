"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/**
 * A short fade on navigation.
 *
 * This used to be a framer-motion `motion.div` starting at opacity 0. That
 * meant every page on the site was invisible until React had hydrated and the
 * animation library had run its first frame, so the animation library sat on
 * the critical path for Largest Contentful Paint on every route.
 *
 * The same effect as a CSS keyframe costs no JavaScript and starts at first
 * paint rather than after hydration. The `key` still restarts it on each
 * navigation, which is the only reason this is a client component at all.
 *
 * globals.css already zeroes animations under prefers-reduced-motion.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-fade w-full flex-grow flex flex-col">
      {children}
    </div>
  );
}
