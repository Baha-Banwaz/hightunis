"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

const STATEMENT =
  "Behind the whitewashed walls of Sidi Bou Said, in the palm groves of Tozeur and on the marinas of Bizerte, there is a Tunisia few people ever see.";

/**
 * The statement that follows the hero. One sentence about the place, read
 * word by word as it scrolls into view: each word darkens from a faint grey
 * to black. That is the only motion on the section, and it is skipped
 * entirely when the visitor prefers reduced motion.
 */
export default function Statement() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.5"],
  });

  const words = STATEMENT.split(" ");

  return (
    <section className="bg-white px-6 lg:px-12 pt-12 pb-28 md:pt-16 md:pb-40">
      <div className="mx-auto max-w-[1180px] grid grid-cols-12 gap-x-6">
        <p
          ref={ref}
          className="col-span-12 text-[2.1rem] leading-[1.12] md:text-[clamp(2.75rem,4.4vw,4.75rem)] md:leading-[1.08] font-medium tracking-[-0.025em] text-black"
        >
          {reduceMotion
            ? STATEMENT
            : words.map((word, i) => (
                <Word
                  key={i}
                  progress={scrollYProgress}
                  range={[i / words.length, (i + 1) / words.length]}
                >
                  {word}
                </Word>
              ))}
        </p>

        <div className="col-span-12 md:col-start-7 md:col-span-6 mt-14 md:mt-20">
          <p className="text-base md:text-lg leading-relaxed text-black/70 max-w-[34ch]">
            We find its finest homes, visit every one ourselves, and open the
            door for a small number of clients.
          </p>
          <Link
            href="/about"
            className="mt-8 inline-block text-sm font-medium text-black border-b border-black pb-1 hover:text-black/50 hover:border-black/30 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
          >
            About the agency
          </Link>
        </div>
      </div>
    </section>
  );
}

function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <>
      <motion.span style={{ opacity }}>{children}</motion.span>{" "}
    </>
  );
}
