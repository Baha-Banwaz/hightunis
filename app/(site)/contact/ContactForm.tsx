"use client";

import { useState } from "react";
import Link from "next/link";
import { CONTACT_CONSENT_TEXT } from "@/lib/consent";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    type: "",
    message: "",
  });
  // Honeypot. Hidden from people, filled in by most bots.
  const [company, setCompany] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Goes to our own route, which validates server-side and writes to
    // Supabase with the service role. The browser has no database access.
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "contact", ...formData, consent, company }),
    }).catch(() => null);

    setLoading(false);

    if (res?.ok) {
      setSuccess(true);
      setFormData({ name: "", email: "", type: "", message: "" });
      setConsent(false);
      setTimeout(() => setSuccess(false), 5000);
      return;
    }

    const body = await res?.json().catch(() => null);
    setError(body?.error ?? "There was an error submitting your inquiry. Please try again.");
  };

  if (success) {
    return (
      <div className="w-full bg-black text-white p-12 text-center">
        <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Inquiry Received</h3>
        <p className="text-sm font-bold uppercase tracking-widest opacity-70">Our concierge will contact you shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col space-y-12">
      <div className="flex flex-col">
        <label className="text-sm font-bold uppercase tracking-widest mb-4">Initial Details</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="FULL NAME"
          className="w-full bg-transparent border-b-2 border-black pb-4 text-2xl font-black uppercase tracking-tighter placeholder:text-black/20 outline-none focus:border-black transition-colors"
        />
      </div>

      <div className="flex flex-col">
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="EMAIL ADDRESS"
          className="w-full bg-transparent border-b-2 border-black pb-4 text-2xl font-black uppercase tracking-tighter placeholder:text-black/20 outline-none focus:border-black transition-colors"
        />
      </div>

      <div className="flex flex-col">
        <input
          type="text"
          required
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value})}
          placeholder="INQUIRY SUBJECT"
          className="w-full bg-transparent border-b-2 border-black pb-4 text-2xl font-black uppercase tracking-tighter placeholder:text-black/20 outline-none focus:border-black transition-colors"
        />
      </div>

      <div className="flex flex-col">
        <textarea
          required
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          placeholder="YOUR MESSAGE"
          rows={4}
          className="w-full bg-transparent border-b-2 border-black pb-4 text-2xl font-black uppercase tracking-tighter placeholder:text-black/20 outline-none focus:border-black transition-colors resize-none"
        ></textarea>
      </div>


      {/* Unticked by default. Required: replying to you is the service. */}
      <div className="flex flex-col">
        <label className="flex items-start gap-4 cursor-pointer group">
          <input
            id="contact-consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => { setConsent(e.target.checked); setError(""); }}
            className="mt-1 w-5 h-5 shrink-0 accent-black cursor-pointer"
          />
          <span className="text-xs font-bold uppercase tracking-[2px] leading-[1.8] text-black/70 group-hover:text-black transition-colors">
            {CONTACT_CONSENT_TEXT.replace(" and I have read the Privacy Policy.", "")}{" "}
            and I have read the{" "}
            <Link href="/privacy" target="_blank" className="border-b border-black text-black hover:opacity-50 transition-opacity">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
      </div>

      {/* Honeypot: off-screen, not announced, never focusable. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto w-px h-px overflow-hidden">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      {error && (
        <p className="text-red-500 text-xs font-bold uppercase tracking-widest">{error}</p>
      )}

      <button
        disabled={loading || !consent}
        type="submit"
        className="disabled:opacity-50 self-start w-full md:w-auto bg-black text-white px-16 py-8 text-sm font-bold uppercase tracking-[3px] hover:bg-black/80 transition-colors mt-8"
      >
        {loading ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
