import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";
import { ADMIN_SCHEMAS, formatZodError } from "@/lib/validation";

const MAX_BODY_BYTES = 512 * 1024;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Parses and validates a request body against the collection's schema.
 * z.object() strips unknown keys, so only known columns reach the database
 * even though this client runs with the service role.
 */
async function parseBody(
  req: Request,
  collection: string,
  mode: "create" | "update"
): Promise<{ ok: true; data: Record<string, unknown> } | { ok: false; response: NextResponse }> {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Request is too large" }, { status: 413 }),
    };
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }

  const schema = ADMIN_SCHEMAS[collection]?.[mode];
  if (!schema) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid collection" }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 }),
    };
  }

  const data = parsed.data as Record<string, unknown>;
  if (mode === "update" && Object.keys(data).length === 0) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Nothing to update" }, { status: 400 }),
    };
  }

  return { ok: true, data };
}

// List of allowed collections to dynamically operate on
const ALLOWED_COLLECTIONS = [
  "properties",
  "services",
  "blog_posts", // Note: The admin frontend calls it blog but table is blog_posts. We'll handle this mapping if necessary, or just use the right table name from the client.
  "team",
  "testimonials",
  "inquiries",
  "property_bookings"
];

const COLLECTION_ALIASES: Record<string, string> = {
  blog: "blog_posts",
  bookings: "property_bookings",
};

function resolveCollection(name: string) {
  return COLLECTION_ALIASES[name] ?? name;
}

// Keeps the availability calendar in sync with an inquiry after ANY edit:
// "booked" (with property + dates) blocks the range, new/contacted releases
// it, "finished" keeps whatever exists. Re-run after every inquiry update so
// date or villa changes on a booked inquiry move the block too.
// The inquiry row is already updated by the time this runs, so a failure here
// leaves the two out of step: the inquiry says "booked" while the calendar has
// nothing blocked. Every exit reports whether the calendar actually matches the
// inquiry, and the caller turns a false into a non-2xx so the admin is never
// told the dates were blocked when they were not.
type SyncResult =
  | { ok: true }
  // "failed" is a database problem; "incomplete" is missing data on the inquiry.
  | { ok: false; kind: "failed" | "incomplete"; reason: string };

async function syncBookingForInquiry(inquiryId: string): Promise<SyncResult> {
  const { data: inquiry, error: readError } = await supabaseAdmin
    .from("inquiries")
    .select("id, name, email, phone, status, property_id, check_in, check_out")
    .eq("id", inquiryId)
    .single();

  if (readError) {
    console.error("[sync] could not re-read inquiry", {
      inquiryId,
      code: readError.code ?? null,
      message: readError.message,
      details: readError.details ?? null,
    });
    return {
      ok: false,
      kind: "failed",
      reason:
        "Your changes were saved, but the availability calendar could not be checked. Reload and confirm the blocked dates.",
    };
  }
  if (!inquiry) return { ok: true };

  // "finished" keeps whatever block already exists, so there is nothing to do.
  if (inquiry.status === "finished") return { ok: true };

  const { error: deleteError } = await supabaseAdmin
    .from("property_bookings")
    .delete()
    .eq("inquiry_id", inquiryId);

  if (deleteError) {
    console.error("[sync] could not clear existing block", {
      inquiryId,
      code: deleteError.code ?? null,
      message: deleteError.message,
      details: deleteError.details ?? null,
    });
    return {
      ok: false,
      kind: "failed",
      reason:
        "Your changes were saved, but the previously blocked dates could not be cleared. The calendar may still show the old range.",
    };
  }

  const shouldBlock =
    inquiry.status === "booked" &&
    inquiry.property_id &&
    inquiry.check_in &&
    inquiry.check_out;

  if (!shouldBlock) {
    // Marking an inquiry booked from the list view skips the edit form's
    // validation, so this is reachable: booked, but nothing to block.
    if (inquiry.status === "booked") {
      return {
        ok: false,
        kind: "incomplete",
        reason:
          "Saved as booked, but no dates were blocked. A booked inquiry needs a property, a check-in and a check-out. Open it and fill those in.",
      };
    }
    return { ok: true };
  }

  const row = {
    property_id: inquiry.property_id,
    start_date: inquiry.check_in,
    end_date: inquiry.check_out,
    source: "inquiry",
    inquiry_id: inquiryId,
    note: inquiry.name,
    guest_name: inquiry.name,
    guest_email: inquiry.email,
    guest_phone: inquiry.phone,
  };

  let insertError = (await supabaseAdmin.from("property_bookings").insert([row])).error;

  if (insertError && /column/i.test(insertError.message)) {
    // guest columns not migrated yet — insert without them
    const { guest_name, guest_email, guest_phone, ...legacy } = row;
    void guest_name; void guest_email; void guest_phone;
    insertError = (await supabaseAdmin.from("property_bookings").insert([legacy])).error;
  }

  if (insertError) {
    console.error("[sync] could not block dates", {
      inquiryId,
      propertyId: inquiry.property_id,
      range: `${inquiry.check_in} -> ${inquiry.check_out}`,
      code: insertError.code ?? null,
      message: insertError.message,
      details: insertError.details ?? null,
    });
    return {
      ok: false,
      kind: "failed",
      reason: `Saved as booked, but the dates were NOT blocked on the calendar: ${insertError.message}`,
    };
  }

  return { ok: true };
}

// Helper to authenticate via the HTTP-only session cookie set by /api/admin/login
async function isAuthenticated() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifySessionToken(token);
}

// Refresh the ISR-cached public pages that render this collection
function revalidateCollection(collection: string) {
  switch (collection) {
    case "properties":
      revalidatePath("/");
      revalidatePath("/listings");
      revalidatePath("/listings/[id]", "page");
      break;
    case "services":
      revalidatePath("/services");
      revalidatePath("/");
      break;
    case "team":
    case "testimonials":
      revalidatePath("/about");
      break;
    case "blog_posts":
      revalidatePath("/blog");
      revalidatePath("/blog/[slug]", "page");
      break;
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ collection: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const resolvedParams = await params;
  const collection = resolveCollection(resolvedParams.collection);

  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  // Allow basic sorting
  let query = supabaseAdmin.from(collection).select("*");
  if (searchParams.has("orderColumn")) {
    const orderColumn = searchParams.get("orderColumn")!;
    // Column names only - never let a caller shape the PostgREST query string.
    if (!/^[a-z][a-z0-9_]{0,62}$/.test(orderColumn)) {
      return NextResponse.json({ error: "Invalid sort column" }, { status: 400 });
    }
    query = query.order(orderColumn, { ascending: searchParams.get("ascending") !== "false" });
  } else if (collection !== "inquiries") {
     if (collection === "properties" || collection === "services" || collection === "team" || collection === "testimonials") {
       // A good default is order if it exists, but since we can't introspect easily via HTTP, 
       // we'll default based on table if explicitly known or rely on client's sort parameter
       if (["properties", "services"].includes(collection)) {
         query = query.order("order", { ascending: true });
       }
     }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ collection: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const collection = resolveCollection(resolvedParams.collection);
  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  const parsed = await parseBody(req, collection, "create");
  if (!parsed.ok) return parsed.response;

  const { data, error } = await supabaseAdmin.from(collection).insert([parsed.data]).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidateCollection(collection);
  return NextResponse.json(data);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ collection: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const collection = resolveCollection(resolvedParams.collection);
  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: "Missing or invalid ID" }, { status: 400 });
  }

  const parsed = await parseBody(req, collection, "update");
  if (!parsed.ok) return parsed.response;

  const { data, error } = await supabaseAdmin
    .from(collection)
    .update(parsed.data)
    .eq("id", id)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (collection === "inquiries") {
    const sync = await syncBookingForInquiry(id);
    if (!sync.ok) {
      // The inquiry row itself was written, so say so plainly rather than
      // reporting a clean success the calendar does not back up.
      revalidateCollection(collection);
      return NextResponse.json(
        { error: sync.reason, inquiryUpdated: true, calendarUpdated: false },
        { status: sync.kind === "incomplete" ? 409 : 500 }
      );
    }
  }

  revalidateCollection(collection);
  return NextResponse.json(data);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ collection: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resolvedParams = await params;
  const collection = resolveCollection(resolvedParams.collection);
  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id || !UUID_RE.test(id)) {
    return NextResponse.json({ error: "Missing or invalid ID" }, { status: 400 });
  }

  // Deleting an inquiry also releases its blocked dates (FK only nulls them)
  if (collection === "inquiries") {
    await supabaseAdmin.from("property_bookings").delete().eq("inquiry_id", id);
  }

  const { data, error } = await supabaseAdmin.from(collection).delete().eq("id", id).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidateCollection(collection);
  return NextResponse.json(data);
}
