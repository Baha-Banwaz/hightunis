import Link from "next/link";

// Sits at the app root so it covers every route, including ones outside the
// (site) group. It therefore renders its own shell rather than inheriting the
// site navbar and footer.

export const metadata = {
  title: "Page not found",
  description: "That page does not exist. Links to the collection, the agency division and the concierge.",
};

const DESTINATIONS = [
  { href: "/listings", label: "The Collection", note: "Every villa, hotel, yacht and restaurant we represent." },
  { href: "/services", label: "Agency", note: "Digital curation and brand identity for hospitality." },
  { href: "/blog", label: "Journal", note: "Guides and notes on Tunisia's luxury scene." },
  { href: "/contact", label: "Concierge", note: "Tell us what you are looking for." },
];

export default function NotFound() {
  return (
    <div className="bg-white text-black min-h-screen flex flex-col">
      <div className="flex-grow max-w-[1600px] w-full mx-auto px-6 lg:px-12 pt-32 pb-24">
        <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/40 mb-8">Error 404</p>
        <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none border-b-2 border-black pb-8 mb-10">
          Not Found
        </h1>
        <p className="text-xl md:text-2xl font-medium tracking-tight max-w-2xl mb-16">
          That address does not exist, or the page behind it has moved. Everything below is
          still where it should be.
        </p>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-px bg-black/20 border-2 border-black">
          {DESTINATIONS.map((d) => (
            <li key={d.href} className="bg-white">
              <Link
                href={d.href}
                className="group block p-8 h-full hover:bg-black hover:text-white transition-colors"
              >
                <span className="text-2xl md:text-3xl font-black uppercase tracking-tighter block mb-3">
                  {d.label}
                </span>
                <span className="text-sm font-medium leading-[1.6] text-black/60 group-hover:text-white/70 transition-colors">
                  {d.note}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/"
          className="inline-block mt-14 text-[10px] font-bold uppercase tracking-[3px] border-b-2 border-black pb-1 hover:opacity-50 transition-opacity"
        >
          Back to the home page
        </Link>
      </div>
    </div>
  );
}
