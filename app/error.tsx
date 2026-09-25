"use client";

import Link from "next/link";
import { useEffect } from "react";

// Catches render errors below the root layout. A separate global-error.tsx
// handles failures in the root layout itself, which this cannot reach.

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is the only handle on the server-side stack, which is
    // deliberately not sent to the browser. Logged so it can be correlated.
    console.error("[error boundary]", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="bg-white text-black min-h-screen flex flex-col">
      <div className="flex-grow max-w-[1600px] w-full mx-auto px-6 lg:px-12 pt-32 pb-24">
        <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/40 mb-8">Error 500</p>
        <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none border-b-2 border-black pb-8 mb-10">
          Something Broke
        </h1>
        <p className="text-xl md:text-2xl font-medium tracking-tight max-w-2xl mb-6">
          This one is on us, not on you. The page failed to load. Trying again often works,
          because most of these are momentary.
        </p>
        {error.digest && (
          <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/40 mb-16">
            Reference {error.digest}
          </p>
        )}

        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={reset}
            className="bg-black text-white px-10 py-5 text-xs font-bold uppercase tracking-[3px] hover:bg-black/80 transition-colors"
          >
            Reload this page
          </button>
          <Link
            href="/"
            className="border-2 border-black px-10 py-5 text-xs font-bold uppercase tracking-[3px] hover:bg-black hover:text-white transition-colors"
          >
            Go to the home page
          </Link>
          <Link
            href="/contact"
            className="border-2 border-black px-10 py-5 text-xs font-bold uppercase tracking-[3px] hover:bg-black hover:text-white transition-colors"
          >
            Tell the concierge
          </Link>
        </div>
      </div>
    </div>
  );
}
