"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  
  const bgWhiteValue = useTransform(scrollYProgress, [0.01, 0.25], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 1)"]);
  const textBlackValue = useTransform(scrollYProgress, [0.01, 0.25], ["rgba(255, 255, 255, 1)", "rgba(0, 0, 0, 1)"]);
  const subTextOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const scaleImage = useTransform(scrollYProgress, [0, 1], [1, 1.15]);

  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperties() {
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("published", true)
        .eq("featured", true)
        .order("order", { ascending: true })
        .limit(9);

      if (data) setProperties(data);
      setLoading(false);
    }
    fetchProperties();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      
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
              alt="Luxury Architecture" 
              fill
              className="object-cover opacity-90"
              priority
              unoptimized
            />
          </motion.div>

          {/* Layer 2: The Native Blend Mask Element */}
          <motion.div 
            style={{ backgroundColor: bgWhiteValue }}
            className="absolute inset-0 z-10 w-full px-6 flex flex-col items-center justify-center text-center mix-blend-screen pointer-events-none"
          >
            <motion.h1 
              className="text-[11vw] md:text-[12vw] leading-[0.8] uppercase whitespace-nowrap"
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
              <div className="hidden md:block text-white text-xs font-bold tracking-widest uppercase mb-2">
                Scroll to discover
              </div>
            </motion.div>
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

      {/* 3. CURATED ESTATES CATALOG */}
      <section className="bg-white py-32 px-6 lg:px-12 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between mb-16 border-b-2 border-black pb-8">
          <h2 className="text-4xl md:text-7xl font-bold tracking-tighter text-black uppercase">
            Curated<br/>Estates
          </h2>
          <Link href="/listings" className="group relative flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-full border border-black hover:bg-black hover:text-white transition-all duration-500">
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">View All</span>
            <ArrowUpRight size={16} className="absolute opacity-0 group-hover:opacity-100 group-hover:translate-x-4 group-hover:-translate-y-4 transition-all duration-500" />
          </Link>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-16">
          {loading ? (
            <div className="col-span-full h-[55vh] flex items-center justify-center">
              <div className="text-xl font-bold uppercase tracking-widest animate-pulse">Loading Estates...</div>
            </div>
          ) : properties.length === 0 ? (
            <div className="col-span-full h-[55vh] flex items-center justify-center">
              <div className="text-xl font-bold uppercase tracking-widest opacity-50">No properties available</div>
            </div>
          ) : (
            properties.map((property: any, idx: number) => {
              const mobileHiddenClass = idx > 2 ? "hidden md:flex" : "flex";

              return (
                <Link key={property.id} href={`/listings/${property.slug}`} className={`group ${mobileHiddenClass} flex-col cursor-pointer ${idx === 0 ? "lg:row-span-1" : ""}`}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone mb-5">
                    <Image 
                      src={property.image_url} 
                      alt={property.name} 
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                    />
                    <div className="absolute top-4 left-4 bg-black text-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-[2px]">
                      {property.category}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-2xl font-black tracking-tighter text-black uppercase group-hover:text-black/50 transition-colors duration-300">{property.name}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-[2px] text-black/40">{property.location}</span>
                      <span className="text-sm font-bold text-black tracking-tight">{property.price}</span>
                    </div>
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* Mobile-only: Discover More CTA */}
        <div className="md:hidden flex flex-col items-center mt-16 pt-10 border-t border-black/10">
          <p className="text-xs font-bold uppercase tracking-[3px] text-black/40 mb-6">6 more exclusive estates</p>
          <Link 
            href="/listings" 
            className="group inline-flex items-center gap-3 bg-black text-white px-10 py-4 text-xs font-bold uppercase tracking-[3px] hover:bg-black/80 transition-colors duration-300"
          >
            Discover All Estates
            <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
          </Link>
        </div>
      </section>

      {/* 4. SERVICES CALLOUT - GIANT TYPOGRAPHY */}
      <section className="bg-black text-white py-40 px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-16">
        <div className="w-full md:w-1/2">
          <h2 className="text-[8vw] md:text-[6vw] font-black leading-[0.9] tracking-tighter uppercase mb-12">
            Beyond<br/>Real Estate
          </h2>
          <p className="text-lg md:text-2xl font-medium tracking-tight max-w-lg mb-12">
            Our private agency division handles digital curation, influencer placement, and high-end brand identity for Tunisia's elite hospitality tier.
          </p>
          <Link href="/services" className="inline-flex items-center gap-4 text-sm font-bold uppercase tracking-widest border-b border-white pb-2 hover:text-white/50 hover:border-white/50 transition-colors">
            View Agency Services <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="w-full md:w-1/2 relative h-[50vh] md:h-[70vh]">
          <Image 
            src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1600&auto=format&fit=crop" 
            alt="Services" 
            fill
            className="object-cover opacity-80"
          />
        </div>
      </section>

    </div>
  );
}
