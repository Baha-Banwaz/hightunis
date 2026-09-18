import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { logQueryError } from "@/lib/query-log";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Stories, guides and perspectives on Tunisia's luxury scene — the HighTunis journal.",
};

function formatDate(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function BlogPage() {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, cover_image, published_at, created_at")
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false });

  logQueryError("blog_posts", error);

  const posts = data ?? [];

  return (
    <div className="bg-white min-h-screen pt-32 pb-24 text-black">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase text-black mb-12 border-b-2 border-black pb-8">
          Journal
        </h1>

        {posts.length === 0 ? (
          <div className="h-[40vh] flex items-center justify-center">
            <p className="text-xl font-bold uppercase tracking-widest text-black/30">
              No stories published yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
            {posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group flex flex-col cursor-pointer">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone mb-6">
                  {post.cover_image ? (
                    <Image
                      src={post.cover_image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-black/10 font-black text-6xl uppercase tracking-tighter">
                      HIGHTUNIS
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[3px] text-black/40 mb-3">
                  {formatDate(post.published_at ?? post.created_at)}
                </span>
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase group-hover:text-black/50 transition-colors mb-4">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-base font-medium text-black/60 leading-[1.6] mb-6">
                    {post.excerpt}
                  </p>
                )}
                <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2px] border-b-2 border-black pb-1 self-start group-hover:opacity-50 transition-opacity">
                  Read Story <ArrowUpRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
