import Link from "next/link";
import HoverGallery from "./HoverGallery";
import { ArrowRight } from "lucide-react";

export interface ListingCardProps {
  slug: string;
  title: string;
  location: string;
  price: string;
  imageUrl: string;
  category: string;
  /** The property's other photographs, faded through on hover. */
  gallery?: string[] | null;
  /** Set on the cards above the fold so their image is not lazy-loaded. */
  priority?: boolean;
}

export default function ListingCard({
  slug,
  title,
  location,
  price,
  imageUrl,
  category,
  gallery,
  priority = false,
}: ListingCardProps) {
  // Primary first, then the gallery. Blanks and duplicates removed so the
  // hover cycle never pauses on the same photograph twice or on nothing.
  const images = Array.from(
    new Set([imageUrl, ...(gallery ?? [])].filter((src): src is string => Boolean(src)))
  );
  return (
    <Link href={`/listings/${slug}`} className="group flex flex-col cursor-pointer h-full">
      <div className="relative">
        <HoverGallery
          images={images}
          alt={title}
          priority={priority}
          // The grid is 1 column, then 2 from sm, 3 from lg and 4 from xl,
          // inside a 1600px container, so a card tops out near 360px.
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 360px"
          className="mb-6"
        />
        <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 text-[10px] font-bold uppercase tracking-[2px]">
          {category}
        </div>
      </div>

      <div className="flex flex-col">
        <h3 className="text-3xl font-black tracking-tighter uppercase text-black mb-2 group-hover:text-black/50 transition-colors">
          {title}
        </h3>
        <div className="flex justify-between items-end border-b-2 border-black pb-4 mt-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-black/60">{location}</span>
            <span className="text-lg font-bold text-black mt-1 uppercase tracking-tight">{price}</span>
          </div>
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[2px] group-hover:opacity-50 transition-opacity">
            Explore <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
