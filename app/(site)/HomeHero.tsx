"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

export default function HomeHero() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const bgWhiteValue = useTransform(scrollYProgress, [0.01, 0.25], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 1)"]);
  const textBlackValue = useTransform(scrollYProgress, [0.01, 0.25], ["rgba(255, 255, 255, 1)", "rgba(0, 0, 0, 1)"]);
  const subTextOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const scaleImage = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  // Once the button has faded it must stop being clickable, otherwise an
  // invisible target sits over the page.
  const ctaPointerEvents = useTransform(subTextOpacity, (v) =>
    v < 0.1 ? "none" : "auto"
  );

  return (
    <>
      {/* SECTION 1: HERO */}
      <div ref={containerRef} className="relative h-[200vh]">
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-black">

          {/* Layer 1: Image */}
          <motion.div
            style={{ scale: scaleImage }}
            className="absolute inset-0 w-full h-full"
          >
            <Image
              src="/hero.jpg"
              alt="Whitewashed houses with blue doors above the Gulf of Tunis at dusk, seen from Sidi Bou Said"
              fill
              sizes="100vw"
              className="object-cover opacity-90"
              priority
            />
          </motion.div>

          {/* Layer 2: The Native Blend Mask Element */}
          <motion.div
            style={{ backgroundColor: bgWhiteValue }}
            className="absolute inset-0 z-10 w-full px-4 md:px-6 flex flex-col items-center justify-center text-center mix-blend-screen pointer-events-none"
          >
            <motion.h1
              className="text-[13.5vw] md:text-[12vw] leading-[0.8] uppercase whitespace-nowrap"
              style={{ color: textBlackValue, fontFamily: "'Arial Black', Impact, sans-serif", letterSpacing: "-0.05em" }}
            >
              HIGHTUNIS
            </motion.h1>

            <motion.div
              style={{ opacity: subTextOpacity }}
              className="flex w-full justify-between items-end mt-8 md:mt-16 px-4 md:px-12"
            >
              <p className="text-white text-xs md:text-sm font-bold tracking-widest uppercase max-w-xs text-left">
                The absolute pinnacle of luxury living & experiences.
              </p>
            </motion.div>
          </motion.div>

          {/*
            The primary call to action, and the only one above the fold.

            It sits OUTSIDE the layer above, which is both mix-blend-screen and
            pointer-events-none: inside it the button would be unclickable and
            its colours would be composited against the photograph. Its own
            layer at z-20 keeps it solid white and clickable.

            It fades out on the same scroll as the strapline, and pointer
            events follow the opacity so a fully faded button is never a
            surprise click target.
          */}
          <motion.div
            style={{ opacity: subTextOpacity, pointerEvents: ctaPointerEvents }}
            className="absolute inset-x-0 bottom-16 md:bottom-20 z-20 flex justify-center px-6"
          >
            <Link
              href="/listings"
              className="bg-white text-black px-10 py-5 md:px-14 md:py-6 text-[11px] md:text-xs font-bold uppercase tracking-[3px] hover:bg-black hover:text-white transition-colors"
            >
              See the collection
            </Link>
          </motion.div>

        </div>
      </div>

      {/* 2. STATEMENT MARQUEE */}
      <section className="bg-white py-32 border-b border-black overflow-hidden flex flex-col items-center justify-center">
        <div className="w-full relative whitespace-nowrap flex overflow-hidden">
          <motion.div
            className="flex font-black text-black text-[10vw] uppercase leading-none tracking-tighter"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ ease: "linear", duration: 25, repeat: Infinity }}
          >
            <span className="px-8">UNCOMPROMISING LUXURY • CURATED EXCLUSIVITY •</span>
            <span className="px-8">UNCOMPROMISING LUXURY • CURATED EXCLUSIVITY •</span>
          </motion.div>
        </div>
      </section>
    </>
  );
}
