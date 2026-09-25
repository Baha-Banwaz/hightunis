"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CONTACT_CONSENT_TEXT } from "@/lib/consent";

type Field = "name" | "email" | "type" | "message" | "consent";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ContactForm() {
  const router = useRouter();

  // The services page links here as /contact?subject=<service name>, so an
  // enquiry arrives saying which service it is about. Read once, as the
  // initial value: after that the field belongs to whoever is typing in it,
  // and re-syncing would fight them.
  //
  // This page is prerendered, so the component sits inside a Suspense
  // boundary. Next client-renders the boundary, which is what lets this
  // initialiser see the query string at all.
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState(() => ({
    name: "",
    email: "",
    type: (searchParams.get("subject") ?? "").slice(0, 120),
    message: "",
  }));
  // Honeypot. Hidden from people, filled in by most bots.
  const [company, setCompany] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  /**
   * Mirrors the zod rules the API enforces. The server stays the authority;
   * this exists so a mistake is reported next to the field that caused it,
   * rather than as one sentence at the bottom after a round trip.
   */
  const validate = () => {
    const next: Partial<Record<Field, string>> = {};
    if (!formData.name.trim()) next.name = "Please enter your name";
    if (!EMAIL_RE.test(formData.email.trim())) next.email = "Please enter a valid email address";
    if (!formData.type.trim()) next.type = "Please tell us what this is about";
    if (!formData.message.trim()) next.message = "Please write your message";
    if (!consent) next.consent = "Please confirm you are happy for us to contact you";
    setErrors(next);
    return next;
  };

  const clear = (field: Field) => setErrors((prev) => ({ ...prev, [field]: "" }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const found = validate();
    if (Object.keys(found).length > 0) {
      // Move focus to the first problem, so a keyboard or screen reader user is
      // told what went wrong instead of pressing submit and seeing nothing.
      document.getElementById(`contact-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    setLoading(true);

    // Goes to our own route, which validates server-side and writes to
    // Supabase with the service role. The browser has no database access.
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "contact", ...formData, consent, company }),
    }).catch(() => null);

    if (res?.ok) {
      // The confirmation lives on its own page: it survives a refresh, can be
      // linked to, and has room to say what happens next.
      router.push("/thank-you");
      return;
    }

    setLoading(false);
    const body = await res?.json().catch(() => null);
    setSubmitError(body?.error ?? "We could not send your inquiry. Please try again.");
    errorSummaryRef.current?.focus();
  };

  const fieldClass = (field: Field) =>
    `w-full bg-transparent border-b-2 pb-4 text-2xl font-black uppercase tracking-tighter placeholder:text-black/20 transition-colors ${
      errors[field] ? "border-red-700" : "border-black"
    }`;

  const errorClass = "text-red-700 text-xs font-bold uppercase tracking-[2px] mt-3";

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col space-y-12">
      {submitError && (
        <div
          ref={errorSummaryRef}
          tabIndex={-1}
          role="alert"
          className="border-2 border-red-700 bg-white px-5 py-4 text-xs font-bold uppercase tracking-[2px] text-red-700 leading-[1.7]"
        >
          {submitError}
        </div>
      )}

      <div className="flex flex-col">
        <label htmlFor="contact-name" className="text-sm font-bold uppercase tracking-widest mb-4">
          Full name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          value={formData.name}
          onChange={(e) => { setFormData({ ...formData, name: e.target.value }); clear("name"); }}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
          placeholder="YOUR NAME"
          className={fieldClass("name")}
        />
        {errors.name && <p id="contact-name-error" className={errorClass}>{errors.name}</p>}
      </div>

      <div className="flex flex-col">
        <label htmlFor="contact-email" className="text-sm font-bold uppercase tracking-widest mb-4">
          Email address
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={(e) => { setFormData({ ...formData, email: e.target.value }); clear("email"); }}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "contact-email-error" : undefined}
          placeholder="NAME@EMAIL.COM"
          className={fieldClass("email")}
        />
        {errors.email && <p id="contact-email-error" className={errorClass}>{errors.email}</p>}
      </div>

      <div className="flex flex-col">
        <label htmlFor="contact-type" className="text-sm font-bold uppercase tracking-widest mb-4">
          What is this about
        </label>
        <input
          id="contact-type"
          name="type"
          type="text"
          value={formData.type}
          onChange={(e) => { setFormData({ ...formData, type: e.target.value }); clear("type"); }}
          aria-invalid={Boolean(errors.type)}
          aria-describedby={errors.type ? "contact-type-error" : undefined}
          placeholder="A STAY, A PARTNERSHIP, PRESS"
          className={fieldClass("type")}
        />
        {errors.type && <p id="contact-type-error" className={errorClass}>{errors.type}</p>}
      </div>

      <div className="flex flex-col">
        <label htmlFor="contact-message" className="text-sm font-bold uppercase tracking-widest mb-4">
          Your message
        </label>
        <textarea
          id="contact-message"
          name="message"
          value={formData.message}
          onChange={(e) => { setFormData({ ...formData, message: e.target.value }); clear("message"); }}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          placeholder="DATES, GUESTS, WHAT YOU ARE LOOKING FOR"
          rows={4}
          className={`${fieldClass("message")} resize-none`}
        />
        {errors.message && <p id="contact-message-error" className={errorClass}>{errors.message}</p>}
      </div>

      {/* Unticked by default. Required: replying to you is the service. */}
      <div className="flex flex-col">
        <label htmlFor="contact-consent" className="flex items-start gap-4 cursor-pointer group">
          <input
            id="contact-consent"
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => { setConsent(e.target.checked); clear("consent"); }}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "contact-consent-error" : undefined}
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
        {errors.consent && <p id="contact-consent-error" className={errorClass}>{errors.consent}</p>}
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

      <button
        disabled={loading}
        type="submit"
        className="disabled:opacity-50 self-start w-full md:w-auto bg-black text-white px-16 py-8 text-sm font-bold uppercase tracking-[3px] hover:bg-black/80 transition-colors mt-8"
      >
        {loading ? "Sending your request" : "Send my request"}
      </button>
    </form>
  );
}
