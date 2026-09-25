import type { Metadata } from "next";
import { Breadcrumbs } from "@/app/components/Breadcrumbs";
import { JsonLd, breadcrumbSchema } from "@/lib/structured-data";
import { supabase } from "@/lib/supabase";
import { logQueryError } from "@/lib/query-log";
import ListingCard from "@/app/components/ListingCard";
import ListingsFilter from "./ListingsFilter";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The Collection",
  description:
    
    "Browse the HighTunis collection: cliffside villas in Sidi Bou Said, a restored palace in the Tunis Medina, a yacht at Port El Kantaoui and coastal hotels.",
};

const TRAIL = [{ name: "Home", href: "/" }, { name: "The Collection", href: "/listings" }];

export default async function ListingsPage() {
  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, name, slug, category, location, price, image_url")
    .eq("published", true)
    .order("order", { ascending: true });

  logQueryError("properties", error);

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
        <ListingsFilter categories={(properties ?? []).map((p) => p.category)}>
          {(properties ?? []).map((p, i) => (
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
