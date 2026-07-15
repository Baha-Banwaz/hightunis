import Image from "next/image";
import Link from "next/link";
import { ReactNode, cache } from "react";
import type { Metadata } from "next";
import { ArrowLeft, Wifi, Car, Plane, Wine, Anchor, Coffee } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import BookingForm from "./BookingForm";

export const revalidate = 3600;

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

// cache() dedupes the query between generateMetadata and the page render
const getProperty = cache(async (slug: string) => {
  const { data } = await supabase
    .from("properties")
    .select("id, name, slug, category, location, price, description, image_url, gallery, amenities")
    .eq("slug", slug)
    .single();
  return data;
});

export async function generateStaticParams() {
  const { data } = await supabase
    .from("properties")
    .select("slug")
    .eq("published", true);
  return (data ?? []).map(({ slug }) => ({ id: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) return { title: "Not Found" };

  const raw = property.description ?? "";
  const description = raw.length > 160 ? `${raw.slice(0, 157).trimEnd()}…` : raw;

  return {
    title: property.name,
    description,
    openGraph: {
      title: `${property.name} | HighTunis`,
      description,
      images: property.image_url ? [property.image_url] : [],
    },
  };
}

export default async function ListingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
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
              sizes="(max-width: 1024px) 100vw, 66vw"
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
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover"
              />
             </div>
             <div className="relative h-[30vh] md:h-[40vh] w-full bg-stone">
               <Image
                src={gallery[1] || gallery[0]}
                alt="Exterior"
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
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
            <BookingForm propertyId={property.id} propertyName={property.name} />
          </div>

        </div>
      </div>
    </div>
  );
}
