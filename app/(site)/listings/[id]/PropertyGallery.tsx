"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Catalog rhythm: images take different frames like a printed lookbook
const ASPECTS = ["4 / 3", "3 / 4", "16 / 10", "1 / 1", "4 / 5"];

export default function PropertyGallery({ images, name }: { images: string[]; name: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });

  const count = images.length;

  const scrollToItem = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(count - 1, i));
    const child = track.children[clamped] as HTMLElement | undefined;
    if (child) track.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    let nearest = 0;
    let best = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const dist = Math.abs((child as HTMLElement).offsetLeft - track.scrollLeft);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    });
    setIndex(nearest);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    drag.current = { active: true, startX: e.clientX, scrollLeft: track.scrollLeft, moved: false };
    track.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track || !drag.current.active) return;
    const delta = e.clientX - drag.current.startX;
    if (Math.abs(delta) > 4) drag.current.moved = true;
    track.scrollLeft = drag.current.scrollLeft - delta;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const track = trackRef.current;
    drag.current.active = false;
    track?.releasePointerCapture(e.pointerId);
  };

  if (count === 0) return null;

  return (
    <div className="mb-24">
      {/* Track */}
      <div
        ref={trackRef}
        onScroll={handleScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="flex gap-6 overflow-x-auto snap-x snap-proximity cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, i) => (
          <div
            key={`${src}-${i}`}
            style={{ aspectRatio: ASPECTS[i % ASPECTS.length] }}
            className="relative h-[55vh] md:h-[72vh] shrink-0 snap-start bg-stone overflow-hidden"
          >
            <Image
              src={src}
              alt={`${name} — photo ${i + 1}`}
              fill
              sizes="(max-width: 768px) 90vw, 70vw"
              className="object-cover pointer-events-none"
              priority={i === 0}
              draggable={false}
            />
            <div className="absolute bottom-4 left-4 bg-black text-white px-3 py-1.5 text-[9px] font-bold tracking-[2px]">
              {String(i + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      {count > 1 && (
        <div className="flex items-center justify-between mt-6">
          <span className="text-[10px] font-bold uppercase tracking-[3px] text-black/40">
            Drag or use the arrows — {String(index + 1).padStart(2, "0")} of {String(count).padStart(2, "0")}
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => scrollToItem(index - 1)}
              disabled={index === 0}
              aria-label="Previous photo"
              className="w-14 h-14 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-black"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollToItem(index + 1)}
              disabled={index === count - 1}
              aria-label="Next photo"
              className="w-14 h-14 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-black"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
