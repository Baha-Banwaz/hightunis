import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface ListingCardProps {
  slug: string;
  title: string;
  location: string;
  price: string;
  imageUrl: string;
  category: string;
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
  priority = false,
}: ListingCardProps) {
  return (
    <Link href={`/listings/${slug}`} className="group flex flex-col cursor-pointer h-full">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone mb-6">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
          className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
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
