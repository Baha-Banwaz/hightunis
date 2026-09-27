import type { Metadata } from "next";
import { Breadcrumbs } from "@/app/components/Breadcrumbs";
import { JsonLd, breadcrumbSchema } from "@/lib/structured-data";
import { supabase } from "@/lib/supabase";
import { logQueryError } from "@/lib/query-log";
import ListingCard from "@/app/components/ListingCard";
import ListingsFilter from "./ListingsFilter";
import PropertyMapPanel from "@/app/components/PropertyMapPanel";
import type { MappedProperty } from "@/app/components/PropertyMap";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The Collection",
  description:
    
    "Browse the HighTunis collection: cliffside villas in Sidi Bou Said, a restored palace in the Tunis Medina, a yacht at Port El Kantaoui and coastal hotels.",
};

const TRAIL = [{ name: "Home", href: "/" }, { name: "The Collection", href: "/listings" }];

// Everything the grid needs. The map needs two more columns on top of this.
const GRID_COLUMNS = "id, name, slug, category, location, price, image_url";
const MAP_COLUMNS = `${GRID_COLUMNS}, latitude, longitude`;

/** Coordinates are optional here precisely because the fallback below may not return them. */
interface ListingRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  location: string;
  price: string;
  image_url: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default async function ListingsPage() {
  // Asking for latitude and longitude before the migration has run makes
  // PostgREST reject the whole query, which would empty this page rather than
  // just hide the map. That exact sequencing took the contact form down once
  // before, so this falls back to the grid columns instead of failing.
  //
  // Once the migration has run the fallback never fires, and it can be
  // removed along with GRID_COLUMNS.
  const primary = await supabase
    .from("properties")
    .select(MAP_COLUMNS)
    .eq("published", true)
    .order("order", { ascending: true });

  let rows = primary.data as ListingRow[] | null;
  let error = primary.error;

  if (error) {
    logQueryError("properties (with coordinates)", error);
    const fallback = await supabase
      .from("properties")
      .select(GRID_COLUMNS)
      .eq("published", true)
      .order("order", { ascending: true });
    rows = fallback.data as ListingRow[] | null;
    error = fallback.error;
  }

  logQueryError("properties", error);

  const properties = rows ?? [];

  // Only properties that have been given coordinates appear on the map. A
  // property without them is simply absent from it rather than guessed at.
  const mapped: MappedProperty[] = properties
    .filter(
      (p): p is ListingRow & { latitude: number; longitude: number } =>
        typeof p.latitude === "number" && typeof p.longitude === "number"
    )
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      category: p.category,
      latitude: p.latitude,
      longitude: p.longitude,
    }));

  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <JsonLd data={breadcrumbSchema(TRAIL)} />
        <Breadcrumbs trail={TRAIL} tone="dark" />
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase text-black mb-12 border-b-2 border-black pb-8">
          The Collection
        </h1>
        {/*
          The cards are rendered here, on the server, and passed in as
          children. ListingsFilter only decides which are displayed, so the
          whole grid is in the initial HTML and the images start loading
          before any JavaScript runs.
        */}
        <PropertyMapPanel items={mapped} />

        <ListingsFilter categories={properties.map((p) => p.category)}>
          {properties.map((p, i) => (
            <ListingCard
              key={p.id}
              slug={p.slug}
              title={p.name}
              location={p.location}
              price={p.price}
              imageUrl={p.image_url}
              category={p.category}
              // The first two are above the fold on a phone; the rest can wait.
              priority={i < 2}
            />
          ))}
        </ListingsFilter>
      </div>
    </div>
  );
}
