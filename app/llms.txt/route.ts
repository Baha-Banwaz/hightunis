import { supabase } from "@/lib/supabase";
import { SITE_CONFIG, SITE_URL } from "@/lib/site-config";
import { logQueryError } from "@/lib/query-log";

// llms.txt, served as a route rather than a static file so the property and
// journal lists stay in step with the database, exactly like sitemap.ts.
// Same revalidate window as the pages it describes.

export const revalidate = 3600;

export async function GET() {
  const { data: properties, error: propError } = await supabase
    .from("properties")
    .select("name, slug, category, location, description")
    .eq("published", true)
    .order("order", { ascending: true });
  logQueryError("properties", propError);

  const { data: posts, error: postError } = await supabase
    .from("blog_posts")
    .select("title, slug, excerpt")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false });
  logQueryError("blog_posts", postError);

  const lines: string[] = [
    `# ${SITE_CONFIG.name}`,
    "",
    `> ${SITE_CONFIG.description} ${SITE_CONFIG.name} curates luxury villas, boutique hotels, yachts and restaurants across Tunisia, and runs an agency division for hospitality brands. Based in ${SITE_CONFIG.headquarters.line1}, ${SITE_CONFIG.headquarters.line2}. Founded ${SITE_CONFIG.foundedYear}.`,
    "",
    "Enquiries are sent through a form on the site and answered by a person.",
    "No booking is confirmed on this website and no payment is taken here.",
    "",
    "## Pages",
    `- [Home](${SITE_URL}/): the collection at a glance and the agency division.`,
    `- [The Collection](${SITE_URL}/listings): every published property, filterable by category.`,
    `- [Agency](${SITE_URL}/services): digital curation, influencer placement and brand identity.`,
    `- [Journal](${SITE_URL}/blog): guides and notes on Tunisia's luxury scene.`,
    `- [About](${SITE_URL}/about): why the company exists, and who is behind it.`,
    `- [Inquire](${SITE_URL}/contact): concierge, partnership and press contacts.`,
  ];

  if (properties?.length) {
    lines.push("", "## Properties");
    for (const p of properties) {
      const desc = (p.description ?? "").split(/(?<=\.)\s/)[0].slice(0, 160);
      lines.push(`- [${p.name}](${SITE_URL}/listings/${p.slug}): ${p.category} in ${p.location}. ${desc}`);
    }
  }

  if (posts?.length) {
    lines.push("", "## Journal");
    for (const p of posts) {
      lines.push(`- [${p.title}](${SITE_URL}/blog/${p.slug})${p.excerpt ? `: ${p.excerpt.slice(0, 160)}` : ""}`);
    }
  }

  lines.push(
    "",
    "## Optional",
    `- [Privacy](${SITE_URL}/privacy): what the site collects. It sets no cookies and runs no analytics.`,
    `- [Terms](${SITE_URL}/terms)`,
    `- [Cookies](${SITE_URL}/cookies)`,
    "",
    "## Notes for agents",
    "- /admin and /api are private and disallowed in robots.txt.",
    "- Prices shown are indicative starting points, not quotations.",
    "- Availability on a property page reflects recorded bookings and can change.",
    ""
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
