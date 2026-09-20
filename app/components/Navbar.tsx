"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    // The hero background reaches full white around 50vh.
    const threshold = isHomePage ? window.innerHeight * 0.25 : 10;
    setIsScrolled(latest > threshold);
  });

  useEffect(() => {
    // Check initial state
    const threshold = isHomePage ? window.innerHeight * 0.25 : 10;
    setIsScrolled(window.scrollY > threshold);
  }, [isHomePage]);

  const navLinks = [
    { name: "Estates", href: "/listings" },
    { name: "Services", href: "/services" },
    { name: "Journal", href: "/blog" },
    { name: "Agency", href: "/about" },
    { name: "Concierge", href: "/contact" },
  ];

  // Force black theme if we're not on the home page, or if scrolled past threshold, or if menu is open
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
          {/* Logo */}
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

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-12">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-[10px] md:text-xs font-bold uppercase tracking-[3px] hover:opacity-50 transition-opacity"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center z-50">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[10px] font-bold uppercase tracking-[3px] focus:outline-none"
            >
              {isMobileMenuOpen ? "CLOSE" : "MENU"}
            </button>
          </div>
        </div>
      </nav>

      {/* Full Screen Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 bg-white flex flex-col justify-center px-12"
          >
            <div className="flex flex-col space-y-8">
              {navLinks.map((link, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, ease: "easeOut" }}
                  key={link.name}
                >
                  <Link
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-5xl font-black uppercase tracking-tighter text-black hover:text-black/50 transition-colors"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="absolute bottom-12 left-12 text-sm font-bold uppercase tracking-widest text-black/50"
            >
              EST. 2024
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
