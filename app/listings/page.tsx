"use client";

import { useState, useEffect } from "react";
import ListingCard from "../components/ListingCard";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

const CATEGORIES = ["All", "Villas", "Hotels", "Yachts", "Restaurants"];

export default function ListingsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("published", true)
        .order("order", { ascending: true });
        
      if (data) setProperties(data);
      setLoading(false);
    }
    fetchProperties();
  }, []);

  const filteredListings = activeCategory === "All" 
    ? properties 
    : properties.filter(l => l.category === activeCategory);

  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase text-black mb-12 border-b-2 border-black pb-8">
          The Collection
        </h1>

        {/* Filter */}
        <div className="flex flex-wrap gap-4 mb-16">
          {CATEGORIES.map((cat) => (
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
          {loading ? (
            <div className="col-span-full h-[50vh] flex items-center justify-center">
              <div className="text-xl font-bold uppercase tracking-widest animate-pulse">Loading Collection...</div>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
