import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site-config";
import { logQueryError } from "@/lib/query-log";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = // /privacy, /terms and /cookies are deliberately absent: they carry
  // robots: noindex while they are drafts, and listing a noindex page in a
  // sitemap tells search engines two contradictory things. Add them here once
  // the noindex comes off.
  ["", "/listings", "/services", "/blog", "/about", "/contact"].map(
    (path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "weekly",
      priority: path === "" ? 1 : 0.8,
    })
  );

  const { data, error: propertiesError } = await supabase
    .from("properties")
    .select("slug, created_at")
    .eq("published", true);

  logQueryError("properties", propertiesError);

  const listingRoutes: MetadataRoute.Sitemap = (data ?? []).map(({ slug, created_at }) => ({
    url: `${SITE_URL}/listings/${slug}`,
    lastModified: created_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const { data: posts, error: postsError } = await supabase
    .from("blog_posts")
    .select("slug, published_at, created_at")
    .eq("published", true);

  logQueryError("blog_posts", postsError);

  const blogRoutes: MetadataRoute.Sitemap = (posts ?? []).map(({ slug, published_at, created_at }) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: published_at ?? created_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...listingRoutes, ...blogRoutes];
}
