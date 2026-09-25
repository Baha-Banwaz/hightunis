import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card";

export const alt = "Agency Division | HighTunis";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return ogCard({
    eyebrow: "Agency",
    title: "Agency Division",
    subtitle: "Digital curation, influencer placement and brand identity for Tunisia's hospitality tier.",
  });
}
