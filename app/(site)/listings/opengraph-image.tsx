import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card";

export const alt = "The Collection | HighTunis";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return ogCard({
    eyebrow: "The Collection",
    title: "The Collection",
    subtitle: "Villas, hotels, yachts and restaurants across Tunisia, from Sidi Bou Said to Port El Kantaoui.",
  });
}
