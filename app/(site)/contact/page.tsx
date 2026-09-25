import type { Metadata } from "next";
import { Breadcrumbs } from "@/app/components/Breadcrumbs";
import { JsonLd, breadcrumbSchema } from "@/lib/structured-data";
import { SITE_CONFIG } from "@/lib/site-config";
import { ContentTodo } from "@/app/components/ContentTodo";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Inquire",
  description:
    
    "Reach the HighTunis concierge for private bookings, or the agency team for partnerships and press. Send a request and we will reply to arrange the details.",
};

const CONTACT_METHODS = [
  { label: "Private Bookings", email: SITE_CONFIG.emails.concierge },
  { label: "Agency & Partnerships", email: SITE_CONFIG.emails.partners },
  { label: "Press Inquiries", email: SITE_CONFIG.emails.press },
];

const TRAIL = [{ name: "Home", href: "/" }, { name: "Inquire", href: "/contact" }];

// Where we are. Built from SITE_CONFIG so the footer, the llms.txt summary and
// this page can never disagree about it.
const LOCATION = `${SITE_CONFIG.headquarters.line1}, ${SITE_CONFIG.headquarters.line2}`;

// Deliberately a plain link, not an embedded map.
//
// A Google Maps iframe loads Google's scripts and sets Google's cookies on
// every single view of this page, whether or not the visitor cares where we
// are. That would put the site into cookie-banner territory for the sake of a
// decoration. Our own CSP says frame-src 'none', so any embed - Google's or
// OpenStreetMap's - is blocked at the browser anyway and would need the policy
// weakened to work.
//
// A link costs one tap, sends nothing until it is tapped, opens in the
// visitor's own maps app on a phone, and needs no third-party request, no API
// key and no CSP change. The site still makes zero third-party requests.
const DIRECTIONS_HREF = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(LOCATION)}`;

export default function ContactPage() {
  return (
    <div className="bg-white text-black min-h-screen pt-32 pb-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col items-center">

        {/* Massive Header */}
        <JsonLd data={breadcrumbSchema(TRAIL)} />
        <Breadcrumbs trail={TRAIL} tone="dark" />
        <h1 className="text-[12vw] font-black uppercase tracking-tighter leading-[0.85] text-center border-b-2 border-black pb-12 w-full mb-24">
          INQUIRE
        </h1>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* Contact Methods */}
          <div className="flex flex-col border-r border-black/20 pr-0 lg:pr-10">
            <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mb-12">
              Concierge Services
            </h2>

            <div className="space-y-16">
              {CONTACT_METHODS.map(({ label, email }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mb-2">{label}</p>
                  <a
                    href={`mailto:${email}`}
                    className="block text-[clamp(1.05rem,5.2vw,1.75rem)] lg:text-[clamp(1.5rem,2.5vw,2.5rem)] font-black uppercase tracking-tighter hover:opacity-50 transition-opacity"
                  >
                    {email.split("@")[0]}@<wbr />
                    {email.split("@")[1]}
                  </a>
                </div>
              ))}
            </div>

            {/* Where we are, and how to reach us by phone */}
            <div className="mt-20 pt-10 border-t-2 border-black">
              <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mb-8">
                Find Us
              </h2>

              <address className="not-italic text-[clamp(1.05rem,5.2vw,1.75rem)] lg:text-[clamp(1.5rem,2.5vw,2.5rem)] font-black uppercase tracking-tighter leading-[1.1] mb-6">
                {SITE_CONFIG.headquarters.line1}
                <br />
                {SITE_CONFIG.headquarters.line2}
              </address>

              <ContentTodo>
                Street address and postcode. Two problems to settle first: there
                is no street-level address anywhere in the codebase, and the
                site contradicts itself about the city. SITE_CONFIG.headquarters
                says Sidi Bou Said, Tunis; the privacy and terms pages say
                Mahdia. Whichever is the registered address should be the one in
                SITE_CONFIG, and everything else follows from it.
              </ContentTodo>

              <a
                href={DIRECTIONS_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-8 border-2 border-black px-8 py-5 text-[10px] font-bold uppercase tracking-[3px] hover:bg-black hover:text-white transition-colors"
              >
                Get directions on Google Maps
                <span className="sr-only"> (opens in a new tab)</span>
              </a>

              <div className="mt-12">
                <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mb-2">
                  By Phone
                </p>
                {SITE_CONFIG.phone ? (
                  <a
                    href={`tel:${SITE_CONFIG.phone.replace(/[^+\d]/g, "")}`}
                    className="block text-[clamp(1.05rem,5.2vw,1.75rem)] lg:text-[clamp(1.5rem,2.5vw,2.5rem)] font-black uppercase tracking-tighter hover:opacity-50 transition-opacity"
                  >
                    {SITE_CONFIG.phone}
                  </a>
                ) : (
                  <ContentTodo>
                    The concierge phone number, in full international format, for
                    example +216 71 000 000. Set SITE_CONFIG.phone and it renders
                    right here as a tel: link that dials on a tap. It should also
                    go into localBusinessSchema() in lib/structured-data.tsx,
                    which omits `telephone` for the same reason. Nothing is shown
                    until there is a real number.
                  </ContentTodo>
                )}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="flex flex-col w-full">
            <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mb-12">
              Direct Inquiry
            </h2>
            <ContactForm />
          </div>

        </div>
      </div>
    </div>
  );
}
