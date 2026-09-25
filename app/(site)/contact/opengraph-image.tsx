import { ogCard, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-card";

export const alt = "Inquire | HighTunis";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return ogCard({
    eyebrow: "Concierge",
    title: "Inquire",
    subtitle: "Private bookings, agency partnerships and press. Send a request and we will reply.",
  });
}
