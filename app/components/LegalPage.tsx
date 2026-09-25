import Link from "next/link";
import type { ReactNode } from "react";

// Shared shell for /privacy, /terms and /cookies so the three cannot drift
// apart. Same brutalist frame as the rest of the site: white ground, black
// type, heavy uppercase heading, sharp corners. The body column is narrower
// than the site's 1600px because legal text has to be readable, not looked at.

export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white min-h-screen pt-32 pb-24 text-black">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="mb-16 border-b-2 border-black pb-8">
          <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none mb-6">
            {title}
          </h1>
          <p className="text-xl md:text-2xl font-medium tracking-tight max-w-3xl">{intro}</p>
          <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mt-8">
            Last updated {updated}
          </p>
        </div>

        <div className="max-w-3xl flex flex-col gap-14">{children}</div>

        <div className="max-w-3xl mt-20 pt-8 border-t-2 border-black flex flex-wrap gap-8">
          {[
            { href: "/privacy", label: "Privacy" },
            { href: "/terms", label: "Terms" },
            { href: "/cookies", label: "Cookies" },
            { href: "/contact", label: "Contact" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[10px] font-bold uppercase tracking-[3px] border-b border-black pb-1 hover:opacity-50 transition-opacity"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-5 pb-3 border-b border-black/20">
        {heading}
      </h2>
      <div className="flex flex-col gap-4 text-base md:text-lg leading-[1.7] text-black/80">
        {children}
      </div>
    </section>
  );
}

export function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-4">
          <span className="text-black/30 font-bold shrink-0">{String(i + 1).padStart(2, "0")}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A gap only the business owner can fill. Rendered loudly on purpose: these
 * pages are drafts, and a placeholder that blends in is a placeholder that
 * ships. The three pages carry robots: noindex while any of these remain.
 */
export function Todo({ children }: { children: ReactNode }) {
  return (
    <p className="border-2 border-black bg-white px-5 py-4 text-sm font-bold uppercase tracking-[2px] leading-[1.7]">
      <span className="block text-[10px] tracking-[3px] text-black/60 mb-2">
        TODO_LEGAL_NEEDED
      </span>
      {children}
    </p>
  );
}
