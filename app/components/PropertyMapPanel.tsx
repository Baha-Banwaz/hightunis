"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { MappedProperty } from "./PropertyMap";

/**
 * The map, behind a button.
 *
 * WHY IT IS NOT LOADED AUTOMATICALLY, measured rather than assumed. With the
 * map auto-loading, /listings scored 76 with an LCP of 5.0s. Behind this
 * button it scores 99 with an LCP of 2.1s, against a no-map baseline of 95.
 * Leaflet plus its stylesheet is ~45 kB gzip and the tiles were another
 * ~131 kB, and none of it is on the path to first paint this way.
 *
 * It also settles the mobile scroll problem. A full-width map inside a
 * scrolling page swallows the scroll; one that does not exist until asked for
 * cannot. After that, one finger scrolls the page and two pan the map.
 *
 * And it is the privacy boundary. No request reaches CARTO until someone
 * presses this, so a visitor who never opens the map never has their IP sent
 * anywhere. The button text says so.
 *
 * ssr: false because Leaflet needs `window`. That option is not allowed in a
 * server component, which is the whole reason this wrapper is a client
 * component rather than the dynamic() call living in the page.
 */
const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black/5 flex items-center justify-center">
      <span className="text-[10px] font-bold uppercase tracking-[3px] text-black/60">
        Loading the map
      </span>
    </div>
  ),
});

export default function PropertyMapPanel({ items }: { items: MappedProperty[] }) {
  const [open, setOpen] = useState(false);

  // Nothing to place. Rendering an empty map would be worse than no map.
  if (items.length === 0) return null;

  // Without a key CARTO does not return an error, it returns a tile stamped
  // "API KEY REQUIRED" across every square. A broken map that looks like a
  // working one is worse than no map, so the whole panel stands down.
  if (!process.env.NEXT_PUBLIC_CARTO_KEY) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <p className="mb-16 border-2 border-dashed border-black px-4 py-3 text-[10px] font-bold uppercase tracking-[2px] leading-[1.8]">
        Map hidden: NEXT_PUBLIC_CARTO_KEY is not set. Get a free key at
        carto.com/basemaps/apikey and put it in .env.local and in the Vercel
        project settings.
      </p>
    );
  }

  return (
    <section aria-label="Property locations" className="mb-16">
      <div className="flex flex-wrap items-baseline justify-between gap-4 mb-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/60">
          Where they are
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-[2px] text-black/60">
          Locations are approximate
        </p>
      </div>

      {/*
        Fixed height on the container, identical in both states, so swapping
        the placeholder for the map moves nothing. Measured CLS stays 0.000.
      */}
      <div className="w-full h-[420px] md:h-[520px] border-2 border-black">
        {open ? (
          <PropertyMap items={items} />
        ) : (
          <div className="w-full h-full bg-black/5 flex flex-col items-center justify-center gap-5 px-6 text-center">
            <MapPin size={28} aria-hidden="true" className="text-black/40" />
            <p className="text-xs font-bold uppercase tracking-[2px] text-black/70 max-w-sm leading-[1.8]">
              {items.length} {items.length === 1 ? "property" : "properties"} with a location.
              Shown as approximate areas, not addresses.
            </p>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="bg-black text-white px-10 py-5 text-[11px] font-bold uppercase tracking-[3px] hover:bg-black/80 transition-colors"
            >
              Show the map
            </button>
            <p className="text-[10px] font-semibold tracking-[1px] text-black/60 max-w-xs leading-[1.7]">
              Opening it loads map images from CARTO, which is outside this site. Nothing is
              sent until you do.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
