"use client";

import { useState } from "react";
import ListingCard from "@/app/components/ListingCard";
import { motion, AnimatePresence } from "framer-motion";

export interface ListingSummary {
  id: string;
  name: string;
  slug: string;
  category: string;
  location: string;
  price: string;
  image_url: string;
}

export default function ListingsGrid({ properties }: { properties: ListingSummary[] }) {
  const [activeCategory, setActiveCategory] = useState("All");

  // Tabs adapt to whatever categories actually exist in the data
  const categories = ["All", ...Array.from(new Set(properties.map((p) => p.category).filter(Boolean)))];

  const filteredListings =
    activeCategory === "All"
      ? properties
      : properties.filter((l) => l.category === activeCategory);

  return (
    <>
      {/* Filter */}
      <div className="flex flex-wrap gap-4 mb-16">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-8 py-3 text-[10px] font-bold uppercase tracking-[2px] transition-colors border border-black ${
              activeCategory === cat
                ? "bg-black text-white"
                : "bg-transparent text-black hover:bg-black/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
        <AnimatePresence mode="popLayout">
          {filteredListings.map((listing) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <ListingCard
                slug={listing.slug}
                title={listing.name}
                location={listing.location}
                price={listing.price}
                imageUrl={listing.image_url}
                category={listing.category}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
