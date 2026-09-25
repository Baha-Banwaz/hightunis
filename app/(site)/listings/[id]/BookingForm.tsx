"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CONTACT_CONSENT_TEXT } from "@/lib/consent";
import DatePicker from "@/app/components/DatePicker";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// 8–15 digits, optional leading +, spaces/dashes/dots/parentheses allowed
const PHONE_RE = /^\+?[\d\s().-]{8,20}$/;

interface BlockedRange {
  start: Date;
  end: Date; // exclusive — the checkout day itself is free for a new check-in
}

function parseISODate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function BookingForm({
  propertyId,
  propertyName,
}: {
  propertyId: string;
  propertyName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  // Honeypot. Hidden from people, filled in by most bots.
  const [company, setCompany] = useState("");
  const [consent, setConsent] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [blocked, setBlocked] = useState<BlockedRange[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const submitErrorRef = useRef<HTMLParagraphElement>(null);

  // Live availability: fetched on mount so it is never stale ISR data.
  // Served by /api/availability, which reads property_bookings with the
  // service role and returns ONLY start_date and end_date. The browser has
  // no read access to that table, so guest details can never leak.
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `/api/availability?propertyId=${encodeURIComponent(propertyId)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const body: { ranges?: { start_date: string; end_date: string }[] } = await res.json();
        setBlocked(
          (body.ranges ?? []).map((b) => ({
            start: parseISODate(b.start_date),
            end: parseISODate(b.end_date),
          }))
        );
      } catch {
        // Aborted or offline: the form still works, dates just are not greyed out.
      }
    })();
    return () => controller.abort();
  }, [propertyId]);

  const isNightBlocked = (date: Date) =>
    blocked.some((r) => date >= r.start && date < r.end);

  const spanOverlapsBooking = (from: Date, to: Date) =>
    blocked.some((r) => from < r.end && to > r.start);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Please enter your name";
    if (!EMAIL_RE.test(email.trim())) next.email = "Please enter a valid email";
    const digits = phone.replace(/[^\d]/g, "");
    if (!PHONE_RE.test(phone.trim()) || digits.length < 8 || digits.length > 15) {
      next.phone = "Please enter a valid phone number";
    }
    if (!consent) next.consent = "Please confirm you are happy for us to contact you";
    if (!checkIn) next.checkIn = "Select a check-in date";
    if (!checkOut) next.checkOut = "Select a check-out date";
    if (checkIn && checkOut && checkOut <= checkIn) {
      next.checkOut = "Check-out must be after check-in";
    }
    if (checkIn && checkOut && checkOut > checkIn && spanOverlapsBooking(checkIn, checkOut)) {
      next.checkOut = "Those dates include unavailable nights";
    }
    setErrors(next);
    return next;
  };

  // Same order as the fields on screen, so focus lands on the first visible
  // problem rather than whichever key the object happens to yield first.
  const FIELD_ORDER = ["name", "email", "phone", "checkIn", "checkOut", "consent"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const found = validate();
    if (Object.keys(found).length > 0) {
      const first = FIELD_ORDER.find((f) => found[f]);
      if (first) document.getElementById(`booking-${first}`)?.focus();
      return;
    }

    setSubmitting(true);

    // Posted to our own route. It re-runs this validation with zod, checks
    // the property is published, re-checks the dates against live bookings,
    // and sets status itself. The browser cannot write to Supabase at all.
    const res = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "booking",
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        propertyId,
        checkIn: checkIn ? toISODate(checkIn) : "",
        checkOut: checkOut ? toISODate(checkOut) : "",
        message: message.trim(),
        consent,
        company,
      }),
    }).catch(() => null);

    if (res?.ok) {
      // The confirmation lives on its own page: it survives a refresh, can be
      // linked to, and has room to say what happens next. The property name is
      // not put in the URL - it would be guest data in a shareable link.
      router.push("/thank-you");
      return;
    }

    setSubmitting(false);
    const body = await res?.json().catch(() => null);
    setErrors({ submit: body?.error ?? "Something went wrong. Please try again." });
    submitErrorRef.current?.focus();
  };

  const fieldClass =
    "bg-transparent border-none font-bold uppercase tracking-widest text-sm placeholder:text-black/50 w-full";
  // red-700, not red-500: at 9px this has to clear 4.5:1 on white.
  const errorClass = "text-red-700 text-[10px] font-bold uppercase tracking-[2px] mt-2";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={`Request a stay at ${propertyName}`}
      className="sticky top-32 border-2 border-black p-12 bg-white flex flex-col"
    >
      <h3 className="text-3xl font-black uppercase tracking-tighter mb-8 border-b-2 border-black pb-4">Reserve Space</h3>

      <div className="flex flex-col space-y-6 mb-10">
        <div className="flex flex-col border-b border-black pb-4">
          <label htmlFor="booking-name" className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mb-2">Full Name</label>
          <input
            id="booking-name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "booking-name-error" : undefined}
            placeholder="Your name"
            className={fieldClass}
          />
          {errors.name && <p id="booking-name-error" className={errorClass}>{errors.name}</p>}
        </div>

        <div className="flex flex-col border-b border-black pb-4">
          <label htmlFor="booking-email" className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mb-2">Email</label>
          <input
            id="booking-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "booking-email-error" : undefined}
            placeholder="name@email.com"
            className={fieldClass}
          />
          {errors.email && <p id="booking-email-error" className={errorClass}>{errors.email}</p>}
        </div>

        <div className="flex flex-col border-b border-black pb-4">
          <label htmlFor="booking-phone" className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mb-2">Phone</label>
          <input
            id="booking-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: "" })); }}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "booking-phone-error" : undefined}
            placeholder="+216 12 345 678"
            className={fieldClass}
          />
          {errors.phone && <p id="booking-phone-error" className={errorClass}>{errors.phone}</p>}
        </div>

        <div className="flex flex-col">
          <DatePicker
            id="booking-checkIn"
            label="Check-in"
            invalid={Boolean(errors.checkIn)}
            describedBy={errors.checkIn ? "booking-checkIn-error" : undefined}
            value={checkIn}
            onChange={(d) => {
              setCheckIn(d);
              setErrors((p) => ({ ...p, checkIn: "" }));
              if (checkOut && checkOut <= d) setCheckOut(null);
            }}
            isDateDisabled={isNightBlocked}
          />
          {errors.checkIn && <p id="booking-checkIn-error" className={errorClass}>{errors.checkIn}</p>}
        </div>

        <div className="flex flex-col">
          <DatePicker
            id="booking-checkOut"
            label="Check-out"
            invalid={Boolean(errors.checkOut)}
            describedBy={errors.checkOut ? "booking-checkOut-error" : undefined}
            value={checkOut}
            onChange={(d) => { setCheckOut(d); setErrors((p) => ({ ...p, checkOut: "" })); }}
            minDate={checkIn ? new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + 1) : null}
            isDateDisabled={isNightBlocked}
          />
          {errors.checkOut && <p id="booking-checkOut-error" className={errorClass}>{errors.checkOut}</p>}
        </div>

        <div className="flex flex-col border-b border-black pb-4">
          <label htmlFor="booking-message" className="text-[10px] font-bold uppercase tracking-[3px] text-black/60 mb-2">Message (optional)</label>
          <textarea
            id="booking-message"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Special requests, arrival time..."
            rows={3}
            className={`${fieldClass} resize-none normal-case`}
          />
        </div>
      </div>

      <div className="flex flex-col mb-6">
        <label htmlFor="booking-consent" className="flex items-start gap-3 cursor-pointer">
          <input
            id="booking-consent"
            name="consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => { setConsent(e.target.checked); setErrors((p) => ({ ...p, consent: "" })); }}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "booking-consent-error" : undefined}
            className="mt-0.5 w-4 h-4 shrink-0 accent-black cursor-pointer"
          />
          <span className="text-[10px] font-bold uppercase tracking-[1.5px] leading-[1.7] text-black/70">
            {CONTACT_CONSENT_TEXT.replace(" and I have read the Privacy Policy.", "")}{" "}
            and I have read the{" "}
            <Link href="/privacy" target="_blank" className="border-b border-black text-black hover:opacity-50 transition-opacity">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.consent && <p id="booking-consent-error" className={errorClass}>{errors.consent}</p>}
      </div>

      {/* Honeypot: off-screen, not announced, never focusable. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto w-px h-px overflow-hidden">
        <label htmlFor="booking-company">Company</label>
        <input
          id="booking-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </div>

      {errors.submit && (
        <p ref={submitErrorRef} tabIndex={-1} role="alert" className={`${errorClass} mb-4`}>
          {errors.submit}
        </p>
      )}

      {/* Not disabled when consent is unticked: a dead button explains nothing.
          Submitting instead surfaces the reason next to the checkbox. */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-black text-white text-[10px] font-bold uppercase tracking-[3px] py-6 hover:bg-black/80 transition-colors disabled:opacity-40"
      >
        {submitting ? "Sending your request" : "Request this stay"}
      </button>
    </form>
  );
}
