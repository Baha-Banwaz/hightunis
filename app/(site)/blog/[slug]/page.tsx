import Image from "next/image";
import Link from "next/link";
import { cache } from "react";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logQueryError } from "@/lib/query-log";
import { notFound } from "next/navigation";

export const revalidate = 3600;

// cache() dedupes the query between generateMetadata and the page render
const getPost = cache(async (slug: string) => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("title, slug, content, excerpt, cover_image, published_at, created_at")
    .eq("slug", slug)
    // Defence in depth: RLS already hides unpublished rows from the anon key,
    // but do not rely on a single layer for that.
    .eq("published", true)
    .single();
  logQueryError("blog_posts", error);
  return data;
});

export async function generateStaticParams() {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("published", true);
  logQueryError("blog_posts", error);
  return (data ?? []).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Not Found" };

  const raw = post.excerpt || post.content || "";
  const description = raw.length > 160 ? `${raw.slice(0, 157).trimEnd()}…` : raw;

  return {
    title: post.title,
    description,
    openGraph: {
      title: `${post.title} | HighTunis`,
      description,
      images: post.cover_image ? [post.cover_image] : [],
    },
  };
}

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const paragraphs = (post.content ?? "")
    .split(/\n+/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  return (
    <div className="bg-white min-h-screen pt-32 pb-24 text-black">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        {/* Back Link */}
        <Link href="/blog" className="inline-flex items-center gap-4 text-[10px] font-bold uppercase tracking-[3px] border-b border-black pb-1 mb-12 hover:opacity-50 transition-opacity">
          <ArrowLeft size={16} /> Back to Journal
        </Link>

        {/* Title */}
        <div className="mb-16 border-b-2 border-black pb-8">
          <span className="text-xs font-bold uppercase tracking-[3px] text-black/50 mb-4 block">
            {formatDate(post.published_at ?? post.created_at)}
          </span>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none">
            {post.title}
          </h1>
        </div>

        {/* Cover */}
        {post.cover_image && (
          <div className="relative h-[50vh] md:h-[75vh] w-full bg-stone mb-24">
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Body */}
        <div className="max-w-4xl mx-auto">
          {post.excerpt && (
            <p className="text-2xl md:text-3xl font-medium leading-[1.4] tracking-tight mb-16 border-l-4 border-black pl-8">
              {post.excerpt}
            </p>
          )}
          <div className="space-y-8">
            {paragraphs.map((paragraph: string, idx: number) => (
              <p key={idx} className="text-lg md:text-xl font-medium leading-[1.7] text-black/80">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
