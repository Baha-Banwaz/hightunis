"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";

/**
 * The first change comes quickly, so the movement is noticed while the cursor
 * is still arriving. After that it settles: once you know the images change,
 * a fast cycle is just flicker.
 */
const FIRST_CHANGE_MS = 420;
const HOLD_MS = 1300;

/**
 * Only cycle for a visitor who has a real pointer and has not asked for less
 * motion. A touch device has no hover, so "hover" there means a tap that is
 * really a click on the card, and starting a slideshow under someone's finger
 * as they tap through to a property is just noise.
 */
const CYCLE_QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

function useMayCycle(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(CYCLE_QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(CYCLE_QUERY).matches,
    () => false
  );
}

/**
 * The image area of a listing card. Holds still until hovered, then fades
 * through the property's other photographs.
 *
 * The extra images are not in the page until the first hover. Nine cards with
 * four photographs each would otherwise be 36 images on a page that shows
 * nine, which would undo the work done on this page's load time. They mount on
 * the first hover and stay mounted after that, so a second hover is instant.
 *
 * They are also marked decorative. The card already has an accessible name
 * from its heading and link; announcing four more images of the same property
 * would add length without adding information.
 */
export default function HoverGallery({
  images,
  alt,
  sizes,
  priority = false,
  className = "",
}: {
  /** Primary image first, then the gallery. Duplicates and blanks removed by the caller. */
  images: string[];
  alt: string;
  sizes: string;
  priority?: boolean;
  /** Extra classes for the frame, so each page keeps its own spacing. */
  className?: string;
}) {
  const mayCycle = useMayCycle();
  const [armed, setArmed] = useState(false);
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const first = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (first.current) {
      clearTimeout(first.current);
      first.current = null;
    }
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    setIndex(0);
  }, []);

  const start = useCallback(() => {
    if (!mayCycle || images.length < 2 || first.current || timer.current) return;
    setArmed(true);

    // One quick change, then an interval at the slower pace. A single
    // setInterval cannot do both, and starting the interval straight away at
    // the fast rate would flicker.
    first.current = setTimeout(() => {
      first.current = null;
      setIndex(1);
      timer.current = setInterval(() => {
        setIndex((i) => (i + 1) % images.length);
      }, HOLD_MS);
    }, FIRST_CHANGE_MS);
  }, [mayCycle, images.length]);

  // A card can be unmounted mid-hover by the category filter.
  useEffect(() => stop, [stop]);

  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden bg-stone ${className}`}
      onMouseEnter={start}
      onMouseLeave={stop}
      // Keyboard users reach the card through its link, not this div, so the
      // same effect is offered on focus rather than being mouse-only.
      onFocus={start}
      onBlur={stop}
    >
      {/*
        The zoom lives on this wrapper, not on the images. Transform and
        opacity need different durations - a slow push-in and a quicker fade -
        and one transition declaration on the images could only give them the
        same one.
      */}
      <div className="absolute inset-0 transition-transform duration-[1600ms] ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
        {images.map((src, i) => {
          // The first image is always present. The rest appear once hovered.
          if (i > 0 && !armed) return null;
          return (
            <Image
              key={src}
              src={src}
              alt={i === 0 ? alt : ""}
              aria-hidden={i === 0 ? undefined : true}
              fill
              sizes={sizes}
              priority={i === 0 ? priority : false}
              className={`object-cover transition-opacity duration-500 ease-out motion-reduce:transition-none ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
