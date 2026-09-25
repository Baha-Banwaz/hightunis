import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card";

export const alt = "Elevating Tunisian Luxury | HighTunis";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return ogCard({
    eyebrow: "About",
    title: "Elevating Tunisian Luxury",
    subtitle: "Founded 2024, based in Sidi Bou Said. The digital bridge to Tunisia's hidden estates.",
  });
}
