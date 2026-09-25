import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/app/components/Breadcrumbs";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Request received",
  description:
    "Your request has reached the HighTunis concierge. What happens next, how long it takes, and where to look while you wait.",
  // A confirmation page has no value in search and would look like a dead end
  // if someone landed on it cold.
  robots: "noindex, follow",
};

const TRAIL = [
  { name: "Home", href: "/" },
  { name: "Inquire", href: "/contact" },
  { name: "Request received", href: "/thank-you" },
];

export default function ThankYouPage() {
  return (
    <div className="bg-white text-black min-h-screen pt-32 pb-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <Breadcrumbs trail={TRAIL} />

        <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mb-8">
          Request received
        </p>
        <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none border-b-2 border-black pb-8 mb-12">
          Thank You
        </h1>

        <div className="max-w-3xl">
          <p className="text-xl md:text-3xl font-medium tracking-tight leading-[1.35] mb-14">
            Your request is with the concierge. A person reads every one, so the reply comes
            from someone who can actually answer it rather than an automated acknowledgement.
          </p>

          {/* The single next step, stated plainly. */}
          <div className="border-2 border-black p-8 md:p-10 mb-14">
            <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mb-4">
              What happens next
            </h2>
            <p className="text-lg md:text-xl font-medium leading-[1.6] mb-6">
              We reply by email to confirm availability and the details of your stay. Nothing is
              booked and no payment is taken until you have that confirmation in writing.
            </p>
            {/* TODO_CONTENT_NEEDED: the response time you want to commit to
                publicly, for example "within one working day". Deliberately
                omitted rather than guessed: a promise here is one a guest will
                hold you to. */}
            <p className="text-sm font-bold uppercase tracking-[2px] text-black/60">
              If it is urgent, write directly to{" "}
              <a
                href={`mailto:${SITE_CONFIG.emails.concierge}`}
                className="text-black border-b border-black hover:opacity-50 transition-opacity"
              >
                {SITE_CONFIG.emails.concierge}
              </a>
            </p>
          </div>

          <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mb-6">
            While you wait
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-black/20 border-2 border-black">
            {[
              { href: "/listings", label: "The Collection", note: "The rest of what we represent, from Sidi Bou Said to Bizerte." },
              { href: "/blog", label: "Journal", note: "Notes on the places and how to get the most from them." },
            ].map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className="group bg-white p-8 hover:bg-black hover:text-white transition-colors"
              >
                <span className="text-2xl font-black uppercase tracking-tighter block mb-3">{d.label}</span>
                <span className="text-sm font-medium leading-[1.6] text-black/60 group-hover:text-white/70 transition-colors">
                  {d.note}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
