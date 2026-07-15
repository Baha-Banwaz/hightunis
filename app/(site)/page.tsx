import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import HomeHero from "./HomeHero";

export const revalidate = 3600;

export default async function Home() {
  const { data } = await supabase
    .from("properties")
    .select("id, name, slug, category, location, price, image_url")
    .eq("published", true)
    .eq("featured", true)
    .order("order", { ascending: true })
    .limit(9);

  const properties = data ?? [];
  const hiddenOnMobile = Math.max(properties.length - 3, 0);

  return (
    <div className="bg-white min-h-screen">

      <HomeHero />

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
          {properties.length === 0 ? (
            <div className="col-span-full h-[55vh] flex items-center justify-center">
              <div className="text-xl font-bold uppercase tracking-widest opacity-50">No properties available</div>
            </div>
          ) : (
            properties.map((property, idx) => {
              const mobileHiddenClass = idx > 2 ? "hidden md:flex" : "flex";

              return (
                <Link key={property.id} href={`/listings/${property.slug}`} className={`group ${mobileHiddenClass} flex-col cursor-pointer ${idx === 0 ? "lg:row-span-1" : ""}`}>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone mb-5">
                    <Image
                      src={property.image_url}
                      alt={property.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
          {hiddenOnMobile > 0 && (
            <p className="text-xs font-bold uppercase tracking-[3px] text-black/40 mb-6">
              {hiddenOnMobile} more exclusive {hiddenOnMobile === 1 ? "estate" : "estates"}
            </p>
          )}
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
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover opacity-80"
          />
        </div>
      </section>

    </div>
  );
}
