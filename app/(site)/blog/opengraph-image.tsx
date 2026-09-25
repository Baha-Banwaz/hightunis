import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card";

export const alt = "Journal | HighTunis";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return ogCard({
    eyebrow: "Journal",
    title: "Journal",
    subtitle: "Guides to the Tunisian coast and notes on the estates we represent.",
  });
}
