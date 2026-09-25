import type { ReactNode } from "react";

/**
 * A gap only the business owner can fill: a real phone number, a real address,
 * real FAQ answers, a real case study. Nothing here may be invented.
 *
 * It renders loudly in development, so the gap is impossible to miss while
 * working, and renders nothing in production, so a live page never shows an
 * internal marker to a visitor. The surrounding component is always built in
 * full; only the fact is missing.
 *
 * Every use is listed in the handover notes. Search the tree for
 * TODO_CONTENT_NEEDED to find them all.
 */
export function ContentTodo({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <p className="border-2 border-dashed border-black bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[2px] leading-[1.8]">
      <span className="block text-black/40 mb-1">TODO_CONTENT_NEEDED</span>
      {children}
    </p>
  );
}
