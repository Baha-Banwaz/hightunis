"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import DatePicker, { formatDate } from "@/app/components/DatePicker";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// 8–15 digits, optional leading +, spaces/dashes/dots/parentheses allowed
const PHONE_RE = /^\+?[\d\s().-]{8,20}$/;

export default function BookingForm({
  propertyId,
  propertyName,
}: {
  propertyId: string;
  propertyName: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Please enter your name";
    if (!EMAIL_RE.test(email.trim())) next.email = "Please enter a valid email";
    const digits = phone.replace(/[^\d]/g, "");
    if (!PHONE_RE.test(phone.trim()) || digits.length < 8 || digits.length > 15) {
      next.phone = "Please enter a valid phone number";
    }
    if (!checkIn) next.checkIn = "Select a check-in date";
    if (!checkOut) next.checkOut = "Select a check-out date";
    if (checkIn && checkOut && checkOut <= checkIn) {
      next.checkOut = "Check-out must be after check-in";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    const details = [
      `Booking request for ${propertyName}`,
      `Check-in: ${formatDate(checkIn)}`,
      `Check-out: ${formatDate(checkOut)}`,
      `Phone: ${phone.trim()}`,
      message.trim() ? `\n${message.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { error } = await supabase.from("inquiries").insert([
      {
        name: name.trim(),
        email: email.trim(),
        type: `Booking — ${propertyName}`,
        message: details,
        property_id: propertyId,
      },
    ]);

    setSubmitting(false);
    if (!error) {
      setSuccess(true);
    } else {
      setErrors({ submit: "Something went wrong. Please try again." });
    }
  };

  if (success) {
    return (
      <div className="sticky top-32 border-2 border-black p-12 bg-black text-white text-center">
        <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Request Received</h3>
        <p className="text-xs font-bold uppercase tracking-[2px] opacity-70 leading-[2]">
          Our concierge will contact you shortly to confirm your stay at {propertyName}.
        </p>
      </div>
    );
  }

  const fieldClass =
    "bg-transparent border-none outline-none font-bold uppercase tracking-widest text-sm placeholder:text-black/30 w-full";
  const errorClass = "text-red-500 text-[9px] font-bold uppercase tracking-[2px] mt-2";

  return (
    <form onSubmit={handleSubmit} className="sticky top-32 border-2 border-black p-12 bg-white flex flex-col" noValidate>
      <h3 className="text-3xl font-black uppercase tracking-tighter mb-8 border-b-2 border-black pb-4">Reserve Space</h3>

      <div className="flex flex-col space-y-6 mb-10">
        <div className="flex flex-col border-b border-black pb-4">
          <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
            placeholder="Your name"
            className={fieldClass}
          />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
        </div>

        <div className="flex flex-col border-b border-black pb-4">
          <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
            placeholder="name@email.com"
            className={fieldClass}
          />
          {errors.email && <p className={errorClass}>{errors.email}</p>}
        </div>

        <div className="flex flex-col border-b border-black pb-4">
          <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: "" })); }}
            placeholder="+216 12 345 678"
            className={fieldClass}
          />
          {errors.phone && <p className={errorClass}>{errors.phone}</p>}
        </div>

        <div className="flex flex-col">
          <DatePicker
            label="Check-in"
            value={checkIn}
            onChange={(d) => {
              setCheckIn(d);
              setErrors((p) => ({ ...p, checkIn: "" }));
              if (checkOut && checkOut <= d) setCheckOut(null);
            }}
          />
          {errors.checkIn && <p className={errorClass}>{errors.checkIn}</p>}
        </div>

        <div className="flex flex-col">
          <DatePicker
            label="Check-out"
            value={checkOut}
            onChange={(d) => { setCheckOut(d); setErrors((p) => ({ ...p, checkOut: "" })); }}
            minDate={checkIn ? new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + 1) : null}
          />
          {errors.checkOut && <p className={errorClass}>{errors.checkOut}</p>}
        </div>

        <div className="flex flex-col border-b border-black pb-4">
          <label className="text-[10px] font-bold uppercase tracking-[3px] text-black/50 mb-2">Message (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Special requests, arrival time..."
            rows={3}
            className={`${fieldClass} resize-none normal-case`}
          />
        </div>
      </div>

      {errors.submit && <p className={`${errorClass} mb-4`}>{errors.submit}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-black text-white text-[10px] font-bold uppercase tracking-[3px] py-6 hover:bg-black/80 transition-colors disabled:opacity-40"
      >
        {submitting ? "Sending..." : "Request Booking"}
      </button>
    </form>
  );
}
