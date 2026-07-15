import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import ListingsGrid from "./ListingsGrid";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The Collection",
  description:
    "Tunisia's finest villas, hotels, yachts and restaurants — curated by HighTunis.",
};

export default async function ListingsPage() {
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name, slug, category, location, price, image_url")
    .eq("published", true)
    .order("order", { ascending: true });

  return (
    <div className="bg-white min-h-screen pt-32 pb-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase text-black mb-12 border-b-2 border-black pb-8">
          The Collection
        </h1>
        <ListingsGrid properties={properties ?? []} />
      </div>
    </div>
  );
}
