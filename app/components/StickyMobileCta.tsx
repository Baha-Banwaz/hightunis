"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

const DISMISS_KEY = "ht-cta-dismissed";
// Far enough down that it never competes with the hero, close enough that it
// is there by the time someone is actually reading.
const SHOW_AFTER_PX = 700;

// Pages where it would be noise: the enquiry form is already the whole page,
// and on the confirmation the request has just been sent.
const HIDDEN_ON = ["/contact", "/thank-you"];

/**
 * A single quiet line at the bottom of the screen on phones, offering the one
 * action the whole site is for. Mobile only, dismissible, and it never covers
 * content: the spacer below reserves its height so the end of the page and the
 * footer stay reachable.
 */
export default function StickyMobileCta() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true); // assume dismissed until we know

  useEffect(() => {
    // Per-viewer convenience only, so sessionStorage is right: dismissing it
    // should last the visit, not forever. Private-mode browsers throw on
    // access, so a failure here just means the bar behaves as if it is new.
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Nothing to do: it will reappear on the next page, which is acceptable.
    }
  };

  if (dismissed || HIDDEN_ON.includes(pathname)) return null;

  return (
    <div
      className={`md:hidden transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!visible}
    >
      {/* Reserves the bar's height at the end of the document so nothing is
          permanently hidden underneath it. */}
      <div className="h-16" />

      <div className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-black text-white border-t-2 border-white/20 flex items-stretch">
        <Link
          href="/contact"
          tabIndex={visible ? undefined : -1}
          className="flex-1 flex items-center justify-center px-5 text-[11px] font-bold uppercase tracking-[2px]"
        >
          Plan your stay
        </Link>
        <button
          type="button"
          onClick={dismiss}
          tabIndex={visible ? undefined : -1}
          aria-label="Hide this bar"
          className="w-16 shrink-0 flex items-center justify-center border-l-2 border-white/20"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
