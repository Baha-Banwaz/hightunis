import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card";
import { SITE_CONFIG } from "@/lib/site-config";

export const alt = "Elevating Tunisian Luxury | HighTunis";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return ogCard({
    eyebrow: "About",
    title: "Elevating Tunisian Luxury",
    subtitle: `Founded ${SITE_CONFIG.foundedYear}, based in ${SITE_CONFIG.headquarters.line1}. The digital bridge to Tunisia's hidden estates.`,
  });
}
