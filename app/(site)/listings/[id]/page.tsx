import { ReactNode, cache } from "react";
import type { Metadata } from "next";
import { Wifi, Car, Plane, Wine, Anchor, Coffee } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { OG_DEFAULTS } from "@/lib/og";
import Link from "next/link";
import { Breadcrumbs } from "@/app/components/Breadcrumbs";
import { JsonLd, breadcrumbSchema } from "@/lib/structured-data";
import { logQueryError } from "@/lib/query-log";
import { notFound } from "next/navigation";
import BookingForm from "./BookingForm";
import PropertyGallery from "./PropertyGallery";

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
  const { data, error } = await supabase
    .from("properties")
    .select("id, name, slug, category, location, price, description, image_url, gallery, amenities")
    .eq("slug", slug)
    // Defence in depth: RLS already hides unpublished rows from the anon key,
    // but do not rely on a single layer for that.
    .eq("published", true)
    .single();
  logQueryError("properties", error);
  return data;
});

export async function generateStaticParams() {
  const { data, error } = await supabase
    .from("properties")
    .select("slug")
    .eq("published", true);
  logQueryError("properties", error);
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
      // Spread the defaults back in: Next replaces the whole openGraph object,
      // so without this the page loses siteName and type.
      ...OG_DEFAULTS,
      title: `${property.name} | HighTunis`,
      description,
      // Fall back to the site share image when this record has no photo.
      images: property.image_url ? [property.image_url] : OG_DEFAULTS.images,
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
  const gallery: string[] = Array.isArray(property.gallery) ? property.gallery : [];
  const galleryImages = Array.from(new Set([property.image_url, ...gallery].filter(Boolean)));

  return (
    <div className="bg-white min-h-screen pt-32 pb-24 text-black">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <JsonLd
          data={breadcrumbSchema([
            { name: "Home", href: "/" },
            { name: "The Collection", href: "/listings" },
            { name: property.name, href: `/listings/${property.slug}` },
          ])}
        />
        <Breadcrumbs
          trail={[
            { name: "Home", href: "/" },
            { name: "The Collection", href: "/listings" },
            { name: property.name, href: `/listings/${property.slug}` },
          ]}
        />

        {/* Hero Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b-2 border-black pb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-[3px] text-black/60 mb-4 block">
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

        {/* Catalog Gallery — drag or use the arrows */}
        <PropertyGallery images={galleryImages} name={property.name} />

        {/* Content & Booking Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 relative">

          {/* Main Content */}
          <div className="lg:col-span-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mb-8 border-b border-black/20 pb-4">
              The Architecture
            </h2>
            <p className="text-2xl md:text-4xl font-medium leading-[1.3] tracking-tight mb-24">
              {property.description}
            </p>

            <p className="text-base font-medium leading-[1.7] text-black/60 mb-24 max-w-2xl">
              Every stay in{" "}
              <Link href="/listings" className="text-black border-b border-black hover:opacity-50 transition-opacity">
                the collection
              </Link>{" "}
              is arranged through our concierge. If you represent a property and want it
              presented this way, that is what the{" "}
              <Link href="/services" className="text-black border-b border-black hover:opacity-50 transition-opacity">
                agency division
              </Link>{" "}
              does.
            </p>

            <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mb-8 border-b border-black/20 pb-4">
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
