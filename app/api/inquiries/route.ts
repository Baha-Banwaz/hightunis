import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { formatZodError, publicInquirySchema } from "@/lib/validation";
import { consentRecord } from "@/lib/consent";

// Public write path for the contact form and the booking form.
//
// The browser no longer talks to Supabase directly. Everything arrives here,
// is validated with zod, and is written with the service role from a fixed
// column list, so the client cannot set `status`, `id`, or any other column.

export const dynamic = "force-dynamic";

const MAX_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_BODY_BYTES = 32 * 1024;

export async function POST(req: Request) {
  const limit = rateLimit(`inquiry:${clientIp(req)}`, MAX_PER_WINDOW, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request is too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = publicInquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: formatZodError(parsed.error) },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // status is set here, never taken from the client.
  let row: Record<string, unknown>;

  if (input.kind === "contact") {
    row = {
      name: input.name,
      email: input.email,
      type: input.type,
      message: input.message,
      status: "new",
      // Recorded server-side from a shared constant, so the stored wording is
      // provably the wording that was displayed.
      ...consentRecord(),
    };
  } else {
    if (input.checkOut <= input.checkIn) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
        { status: 400 }
      );
    }

    // The property must exist and be published before we accept a booking for it.
    const { data: property } = await supabaseAdmin
      .from("properties")
      .select("id, name")
      .eq("id", input.propertyId)
      .eq("published", true)
      .single();

    if (!property) {
      return NextResponse.json({ error: "Unknown property" }, { status: 400 });
    }

    // Reject dates that overlap an existing booking. The client checks this
    // too, but the client check is advisory only.
    const { data: clashes } = await supabaseAdmin
      .from("property_bookings")
      .select("id")
      .eq("property_id", input.propertyId)
      .lt("start_date", input.checkOut)
      .gt("end_date", input.checkIn)
      .limit(1);

    if (clashes && clashes.length > 0) {
      return NextResponse.json(
        { error: "Those dates include unavailable nights" },
        { status: 409 }
      );
    }

    const details = [
      `Booking request for ${property.name}`,
      `Check-in: ${input.checkIn}`,
      `Check-out: ${input.checkOut}`,
      `Phone: ${input.phone}`,
      input.message ? `\n${input.message}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    row = {
      name: input.name,
      email: input.email,
      type: `Booking - ${property.name}`,
      message: details,
      phone: input.phone,
      property_id: input.propertyId,
      check_in: input.checkIn,
      check_out: input.checkOut,
      status: "new",
      ...consentRecord(),
    };
  }

  const { error } = await supabaseAdmin.from("inquiries").insert([row]);

  if (error) {
    // Logged server-side; the client gets nothing that describes the schema.
    console.error("[inquiries] insert failed:", error.message);
    return NextResponse.json(
      { error: "We could not record your inquiry. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
