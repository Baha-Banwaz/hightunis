import Link from "next/link";

/**
 * Visible breadcrumbs for inner pages, in the site's own idiom: uppercase,
 * wide tracking, a hairline rule, no chevron icons.
 *
 * The matching BreadcrumbList JSON-LD is emitted by the page, so the visible
 * trail and the structured one are built from the same array and cannot
 * disagree.
 */
export interface Crumb {
  name: string;
  href: string;
}

export function Breadcrumbs({ trail, tone = "dark" }: { trail: Crumb[]; tone?: "dark" | "light" }) {
  const muted = tone === "light" ? "text-white/50" : "text-black/40";
  const active = tone === "light" ? "text-white" : "text-black";

  return (
    <nav aria-label="Breadcrumb" className="mb-10">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold uppercase tracking-[3px]">
        {trail.map((c, i) => {
          const last = i === trail.length - 1;
          return (
            <li key={c.href} className="flex items-center gap-x-3">
              {last ? (
                <span className={active} aria-current="page">
                  {c.name}
                </span>
              ) : (
                <>
                  <Link href={c.href} className={`${muted} hover:${active} transition-colors border-b border-transparent hover:border-current`}>
                    {c.name}
                  </Link>
                  <span aria-hidden="true" className={muted}>
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
