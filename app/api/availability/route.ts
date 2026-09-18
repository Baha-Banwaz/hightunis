import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { availabilityQuerySchema } from "@/lib/validation";

// Replaces the public SELECT on property_bookings.
//
// property_bookings carries guest_name / guest_email / guest_phone. RLS is
// column-blind, so any public read policy on that table exposes guest PII to
// anyone holding the anon key. The policy is gone; availability is served
// here instead, and this route selects ONLY the two date columns.

export const dynamic = "force-dynamic";

const MAX_PER_WINDOW = 60;
const WINDOW_MS = 60 * 1000;

function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

export async function GET(req: Request) {
  const limit = rateLimit(`availability:${clientIp(req)}`, MAX_PER_WINDOW, WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const { searchParams } = new URL(req.url);
  const parsed = availabilityQuerySchema.safeParse({
    propertyId: searchParams.get("propertyId") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid property" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("property_bookings")
    // Only these two columns ever leave the server for this route.
    .select("start_date, end_date")
    .eq("property_id", parsed.data.propertyId)
    .gte("end_date", todayISO())
    .order("start_date", { ascending: true });

  if (error) {
    console.error("[availability] query failed:", error.message);
    return NextResponse.json({ error: "Could not load availability" }, { status: 500 });
  }

  // Defensive: shape the response explicitly rather than spreading rows.
  const ranges = (data ?? []).map((b) => ({
    start_date: b.start_date as string,
    end_date: b.end_date as string,
  }));

  return NextResponse.json(
    { ranges },
    { headers: { "Cache-Control": "no-store" } }
  );
}
