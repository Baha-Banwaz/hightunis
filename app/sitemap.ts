import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { SITE_URL } from "@/lib/site-config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = ["", "/listings", "/services", "/blog", "/about", "/contact"].map(
    (path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "weekly",
      priority: path === "" ? 1 : 0.8,
    })
  );

  const { data } = await supabase
    .from("properties")
    .select("slug, created_at")
    .eq("published", true);

  const listingRoutes: MetadataRoute.Sitemap = (data ?? []).map(({ slug, created_at }) => ({
    url: `${SITE_URL}/listings/${slug}`,
    lastModified: created_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, published_at, created_at")
    .eq("published", true);

  const blogRoutes: MetadataRoute.Sitemap = (posts ?? []).map(({ slug, published_at, created_at }) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified: published_at ?? created_at ?? undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...listingRoutes, ...blogRoutes];
}
