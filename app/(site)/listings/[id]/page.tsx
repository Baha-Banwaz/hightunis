import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { ArrowLeft, Wifi, Car, Plane, Wine, Anchor, Coffee } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

const ICON_MAP: Record<string, ReactNode> = {
  "Infinity Pool": <Anchor size={20} />,
  "Private Chef": <Wine size={20} />,
  "Airport Transfer": <Plane size={20} />,
  "Chauffeur": <Car size={20} />,
  "High-Speed WiFi": <Wifi size={20} />,
  "Daily Breakfast": <Coffee size={20} />,
  "Spa & Hammam": <Wine size={20} />,
  "3 En-suite Cabins": <Anchor size={20} />,
  "Private Cinema": <Wine size={20} />,
};

export default async function ListingDetail({ params }: { params: { id: string } }) {
  const { data: property, error } = await supabase
    .from("properties")
    .select("*")
    .eq("slug", params.id)
    .single();

  if (error || !property) {
    notFound();
  }

  const amenities = Array.isArray(property.amenities) ? property.amenities : [];
  const gallery = Array.isArray(property.gallery) && property.gallery.length > 0 
    ? property.gallery 
    : [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop"
      ];

  return (
    <div className="bg-white min-h-screen pt-32 pb-24 text-black">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {/* Back Link */}
        <Link href="/listings" className="inline-flex items-center gap-4 text-[10px] font-bold uppercase tracking-[3px] border-b border-black pb-1 mb-12 hover:opacity-50 transition-opacity">
          <ArrowLeft size={16} /> Back to Collection
        </Link>
        
        {/* Hero Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b-2 border-black pb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-[3px] text-black/50 mb-4 block">
              {property.location}
            </span>
            <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none">
              {property.name}
            </h1>
          </div>
          <div className="text-2xl md:text-4xl font-bold uppercase tracking-tight mt-8 md:mt-0">
            {property.price}
          </div>
        </div>

        {/* Masonry / Parallax Layout Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-24">
          <div className="lg:col-span-8 relative h-[60vh] md:h-[80vh] w-full bg-stone">
             <Image 
              src={property.image_url} 
              alt={property.name} 
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-12">
             <div className="relative h-[30vh] md:h-[40vh] w-full bg-stone">
               <Image 
                src={gallery[0]} 
                alt="Interior" 
                fill
                className="object-cover"
              />
             </div>
             <div className="relative h-[30vh] md:h-[40vh] w-full bg-stone">
               <Image 
                src={gallery[1] || gallery[0]} 
                alt="Exterior" 
                fill
                className="object-cover"
              />
             </div>
          </div>
        </div>

        {/* Content & Booking Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 relative">
          
          {/* Main Content */}
          <div className="lg:col-span-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-8 border-b border-black/20 pb-4">
              The Architecture
            </h2>
            <p className="text-2xl md:text-4xl font-medium leading-[1.3] tracking-tight mb-24">
              {property.description}
            </p>

            <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-8 border-b border-black/20 pb-4">
              Amenities
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-12">
              {amenities.map((amenity: string, idx: number) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="text-black">{ICON_MAP[amenity] || <Wifi size={20} />}</div>
                  <span className="text-sm font-bold uppercase tracking-widest">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Booking Widget */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 border-2 border-black p-12 bg-white flex flex-col">
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-8 border-b-2 border-black pb-4">Reserve Space</h3>
              
              <div className="flex flex-col space-y-6 mb-12">
                <div className="flex flex-col border-b border-black pb-4">
                  <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2">Check-in</label>
                  <input type="date" className="bg-transparent border-none outline-none font-bold uppercase tracking-widest text-sm" />
                </div>
                <div className="flex flex-col border-b border-black pb-4">
                  <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2">Check-out</label>
                  <input type="date" className="bg-transparent border-none outline-none font-bold uppercase tracking-widest text-sm" />
                </div>
              </div>

              <button className="w-full bg-black text-white text-[10px] font-bold uppercase tracking-[3px] py-6 hover:bg-black/80 transition-colors">
                Request Booking
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
