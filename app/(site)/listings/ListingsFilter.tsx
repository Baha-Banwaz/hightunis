"use client";

import { useState, type ReactNode } from "react";

/**
 * The category tabs, and nothing else.
 *
 * This replaces a client component that received the property data as props
 * and rendered the whole grid itself, every card wrapped in a framer-motion
 * div starting at opacity 0. Two costs came with that: the cards, including
 * the page's Largest Contentful Paint image, stayed invisible until React had
 * hydrated and run the first animation frame; and the animation library was
 * pulled into the route.
 *
 * Now the cards are rendered on the server and handed in as `children`. They
 * are in the initial HTML, so the browser can start fetching the images before
 * any JavaScript arrives. All this component does is decide which of them are
 * displayed, which is the only part that genuinely needs state.
 *
 * Filtering hides with CSS rather than unmounting, so switching tabs never
 * re-downloads an image that was already fetched.
 */
export default function ListingsFilter({
  categories,
  children,
}: {
  /** One entry per child, in the same order. */
  categories: string[];
  children: ReactNode[];
}) {
  const [active, setActive] = useState("All");

  const tabs = ["All", ...Array.from(new Set(categories.filter(Boolean)))];

  return (
    <>
      <div className="flex flex-wrap gap-4 mb-16" role="group" aria-label="Filter by category">
        {tabs.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActive(cat)}
            aria-pressed={active === cat}
            className={`px-8 py-3 text-[10px] font-bold uppercase tracking-[2px] transition-colors border border-black ${
              active === cat
                ? "bg-black text-white"
                : "bg-transparent text-black hover:bg-black/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/*
        The cards carry h3 headings, which follow the page h1 with nothing in
        between. Naming the grid restores the order for anyone navigating by
        heading; it is not shown because the tabs above already say what this
        is to someone who can see them.
      */}
      <h2 className="sr-only">Properties</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
        {children.map((child, i) => {
          const shown = active === "All" || categories[i] === active;
          // hidden rather than unmounted: the browser keeps the decoded image.
          return (
            <div key={i} hidden={!shown}>
              {child}
            </div>
          );
        })}
      </div>
    </>
  );
}
