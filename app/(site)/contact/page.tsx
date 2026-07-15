import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/site-config";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Inquire",
  description:
    "Contact the HighTunis concierge for private bookings, partnerships, and press inquiries.",
};

const CONTACT_METHODS = [
  { label: "Private Bookings", email: SITE_CONFIG.emails.concierge },
  { label: "Agency & Partnerships", email: SITE_CONFIG.emails.partners },
  { label: "Press Inquiries", email: SITE_CONFIG.emails.press },
];

export default function ContactPage() {
  return (
    <div className="bg-white text-black min-h-screen pt-32 pb-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col items-center">

        {/* Massive Header */}
        <h1 className="text-[12vw] font-black uppercase tracking-tighter leading-[0.85] text-center border-b-2 border-black pb-12 w-full mb-24">
          INQUIRE
        </h1>

        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-24">

          {/* Contact Methods */}
          <div className="flex flex-col border-r border-black/20 pr-0 lg:pr-24">
            <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-12">
              Concierge Services
            </h2>

            <div className="space-y-16">
              {CONTACT_METHODS.map(({ label, email }) => (
                <div key={label}>
                  <p className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2">{label}</p>
                  <a href={`mailto:${email}`} className="text-3xl md:text-5xl font-black uppercase tracking-tighter hover:opacity-50 transition-opacity break-all">
                    {email}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="flex flex-col w-full">
            <h2 className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-12">
              Direct Inquiry
            </h2>
            <ContactForm />
          </div>

        </div>
      </div>
    </div>
  );
}
