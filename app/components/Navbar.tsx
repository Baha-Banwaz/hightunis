"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isHomePath } from "@/lib/routes";

// No animation library here any more. This component is in the site layout, so
// whatever it imports is downloaded on every page: framer-motion's useScroll
// and AnimatePresence cost about 40 kB gzip to do a background colour change
// and a panel slide, both of which CSS does natively.

const NAV_LINKS = [
  { name: "Estates", href: "/listings" },
  { name: "Services", href: "/services" },
  { name: "Journal", href: "/blog" },
  { name: "Agency", href: "/about" },
  { name: "Concierge", href: "/contact" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const isHomePage = isHomePath(pathname);

  useEffect(() => {
    // The hero background reaches full white around 50vh; elsewhere the navbar
    // is solid immediately. A passive listener, which is what useScroll was
    // wrapping anyway.
    const onScroll = () => {
      const threshold = isHomePage ? window.innerHeight * 0.25 : 10;
      setIsScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHomePage]);

  // Escape closes the menu and returns focus to the button that opened it,
  // so a keyboard user is not stranded at the top of the document.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMobileMenuOpen]);

  // Dark theme off the home page, once scrolled past the hero, or while the
  // menu covers the screen.
  const needsDarkTheme = !isHomePage || isScrolled || isMobileMenuOpen;
  const logoSrc = needsDarkTheme ? "/Black.svg" : "/White.svg";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
          needsDarkTheme ? "bg-white text-black border-b border-black" : "bg-transparent text-white"
        }`}
      >
        <div className="flex items-center justify-between px-6 lg:px-12 h-24">
          <Link href="/" className="flex-shrink-0 z-50">
            <Image
              src={logoSrc}
              alt="HighTunis"
              width={583}
              height={509}
              className="h-[1.5rem] md:h-[2.1rem] lg:h-[2.4rem] w-auto object-contain transition-all duration-300"
              priority
            />
          </Link>

          <div className="hidden md:flex items-center space-x-12">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[10px] md:text-xs font-bold uppercase tracking-[3px] hover:opacity-50 transition-opacity"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="md:hidden flex items-center z-50">
            <button
              ref={menuButtonRef}
              type="button"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileMenuOpen ? "Close the navigation menu" : "Open the navigation menu"}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[10px] font-bold uppercase tracking-[3px]"
            >
              {isMobileMenuOpen ? "CLOSE" : "MENU"}
            </button>
          </div>
        </div>
      </nav>

      {/*
        Always mounted so CSS can transition it both ways; AnimatePresence
        existed only to animate an unmount. `inert` takes the whole panel out
        of the tab order and the accessibility tree while it is closed, which
        is what conditional rendering was doing for free before.
      */}
      <div
        id="mobile-menu"
        inert={!isMobileMenuOpen}
        className={`md:hidden fixed inset-0 z-40 bg-white flex flex-col justify-center px-12 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"
        }`}
      >
        <div className="flex flex-col space-y-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-5xl font-black uppercase tracking-tighter text-black hover:text-black/50 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <p className="absolute bottom-12 left-12 text-sm font-bold uppercase tracking-widest text-black/60">
          EST. 2024
        </p>
      </div>
    </>
  );
}
