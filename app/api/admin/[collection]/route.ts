import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";
import { parseAdminPayload } from "@/lib/validation";
import {
  ACTOR_ADMIN,
  canTransition,
  isInquiryStatus,
  MISSING_AMOUNT_WARNING,
  transitionError,
  type InquiryStatus,
} from "@/lib/inquiry-status";

const MAX_BODY_BYTES = 512 * 1024;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * HTTP concerns only - size cap and JSON parsing. Validation, unknown-key
 * stripping and the update key intersection live in parseAdminPayload so they
 * can be tested without standing up a Request.
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

  const parsed = parseAdminPayload(collection, mode, body);
  if (!parsed.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: parsed.error }, { status: 400 }),
    };
  }

  return { ok: true, data: parsed.data };
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

/** Columns the inquiry PUT path needs to reason about before it writes. */
const INQUIRY_STATE_COLUMNS =
  "id, status, property_id, check_in, check_out, confirmed_at, cancelled_at, amount_cents";

interface InquiryState {
  id: string;
  status: string | null;
  property_id: string | null;
  check_in: string | null;
  check_out: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  amount_cents: number | null;
}

/**
 * Refuses a booking whose dates overlap an existing block on the same property.
 *
 * Rows belonging to this inquiry are discarded in JS, NOT with a PostgREST
 * neq: `inquiry_id <> 'x'` evaluates to NULL for manual blocks, which would
 * silently skip exactly the rows we most need to see.
 *
 * This is advisory. The authoritative guarantee is the database exclusion
 * constraint property_bookings_no_overlap - check-then-write over PostgREST
 * can never be atomic.
 */
async function findBookingClash(
  propertyId: string,
  checkIn: string,
  checkOut: string,
  ignoreInquiryId: string
): Promise<{ start_date: string; end_date: string; who: string } | null> {
  const { data, error } = await supabaseAdmin
    .from("property_bookings")
    .select("start_date, end_date, inquiry_id, guest_name, note, source")
    .eq("property_id", propertyId)
    .lt("start_date", checkOut)
    .gt("end_date", checkIn);

  if (error) {
    console.error("[clash] could not check availability", {
      propertyId,
      code: error.code ?? null,
      message: error.message,
    });
    throw new Error("availability-check-failed");
  }

  const clash = (data ?? []).find((b) => b.inquiry_id !== ignoreInquiryId);
  if (!clash) return null;

  return {
    start_date: clash.start_date as string,
    end_date: clash.end_date as string,
    who: (clash.guest_name as string) || (clash.note as string) || (clash.source as string) || "another booking",
  };
}

/** Best-effort audit entry. A failure warns; it never blocks the save. */
async function recordStatusEvent(
  inquiryId: string,
  from: string | null,
  to: string,
  actor: string
): Promise<string | null> {
  const { error } = await supabaseAdmin.from("inquiry_status_events").insert([
    { inquiry_id: inquiryId, from_status: from, to_status: to, actor },
  ]);
  if (!error) return null;
  console.error("[audit] could not record status change", {
    inquiryId, from, to, actor,
    code: error.code ?? null,
    message: error.message,
  });
  return `Status changed to "${to}", but the change could not be written to the audit log.`;
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

  const shouldBlock =
    inquiry.status === "booked" &&
    inquiry.property_id &&
    inquiry.check_in &&
    inquiry.check_out;

  // Decide BEFORE destroying anything. Deleting first and only then finding
  // out we cannot re-insert loses the block with nothing to put back.
  if (!shouldBlock) {
    // Marking an inquiry booked from the list view skips the edit form's
    // validation, so this is reachable: booked, but nothing to block.
    if (inquiry.status === "booked") {
      return {
        ok: false,
        kind: "incomplete",
        reason:
          "Saved as booked, but no dates were blocked. A booked inquiry needs a property, a check-in and a check-out. Open it and fill those in. The previously blocked dates were left as they were.",
      };
    }

    // new / contacted: releasing the dates is the intended behaviour.
    const { error: releaseError } = await supabaseAdmin
      .from("property_bookings")
      .delete()
      .eq("inquiry_id", inquiryId);

    if (releaseError) {
      console.error("[sync] could not release dates", {
        inquiryId,
        code: releaseError.code ?? null,
        message: releaseError.message,
        details: releaseError.details ?? null,
      });
      return {
        ok: false,
        kind: "failed",
        reason:
          "Your changes were saved, but the blocked dates could not be released. The calendar may still show the old range.",
      };
    }
    return { ok: true };
  }

  // Snapshot what we are about to replace, so a failed insert can be undone.
  // PostgREST gives us no transaction, so this is the compensating write.
  const { data: previousBlocks, error: snapshotError } = await supabaseAdmin
    .from("property_bookings")
    .select("*")
    .eq("inquiry_id", inquiryId);

  if (snapshotError) {
    console.error("[sync] could not read existing block", {
      inquiryId,
      code: snapshotError.code ?? null,
      message: snapshotError.message,
      details: snapshotError.details ?? null,
    });
    return {
      ok: false,
      kind: "failed",
      reason:
        "Your changes were saved, but the availability calendar could not be read. Reload and confirm the blocked dates.",
    };
  }

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

    // Put back what the delete above removed, so a failure here costs nothing.
    let restored = true;
    if (previousBlocks && previousBlocks.length > 0) {
      const { error: restoreError } = await supabaseAdmin
        .from("property_bookings")
        .insert(previousBlocks);
      if (restoreError) {
        restored = false;
        console.error("[sync] RESTORE FAILED - previous block is lost", {
          inquiryId,
          lost: previousBlocks,
          code: restoreError.code ?? null,
          message: restoreError.message,
        });
      }
    }

    return {
      ok: false,
      kind: "failed",
      reason:
        `Saved as booked, but the dates were NOT blocked on the calendar: ${insertError.message}.` +
        (previousBlocks && previousBlocks.length > 0
          ? restored
            ? " The previous blocked dates were put back."
            : " The previous blocked dates could not be put back either - check the calendar."
          : ""),
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

  const patch: Record<string, unknown> = { ...parsed.data };
  const warnings: string[] = [];
  let statusChange: { from: string | null; to: string } | null = null;

  // ---------------------------------------------------------------------
  // Inquiries: decide everything BEFORE writing. A clash or a disallowed
  // transition must leave the row untouched, not be undone afterwards.
  // ---------------------------------------------------------------------
  if (collection === "inquiries") {
    const { data: current, error: readError } = await supabaseAdmin
      .from("inquiries")
      .select(INQUIRY_STATE_COLUMNS)
      .eq("id", id)
      .single<InquiryState>();

    if (readError || !current) {
      if (readError && readError.code !== "PGRST116") {
        console.error("[inquiry] could not read current state", {
          id, code: readError.code ?? null, message: readError.message,
        });
      }
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const from = current.status;
    const to = (patch.status as string | undefined) ?? from;

    if (!isInquiryStatus(to) || (from !== null && !isInquiryStatus(from))) {
      return NextResponse.json({ error: "Unknown inquiry status" }, { status: 400 });
    }

    // 1. Is this transition legal?
    if (from !== null && to !== from) {
      if (!canTransition(from as InquiryStatus, to)) {
        return NextResponse.json(
          { error: transitionError(from as InquiryStatus, to) },
          { status: 409 }
        );
      }
      statusChange = { from, to };
    }

    // The state the row will be in once this patch is applied.
    const merged = {
      property_id: ("property_id" in patch ? patch.property_id : current.property_id) as string | null,
      check_in: ("check_in" in patch ? patch.check_in : current.check_in) as string | null,
      check_out: ("check_out" in patch ? patch.check_out : current.check_out) as string | null,
      amount_cents: ("amount_cents" in patch ? patch.amount_cents : current.amount_cents) as number | null,
    };

    // 2. Would the result double-book a property? This also covers the edit
    //    form changing dates on an already-booked inquiry, which previously
    //    had no overlap check at all.
    if (to === "booked" && merged.property_id && merged.check_in && merged.check_out) {
      try {
        const clash = await findBookingClash(
          merged.property_id,
          merged.check_in,
          merged.check_out,
          id
        );
        if (clash) {
          return NextResponse.json(
            {
              error:
                `Those dates clash with an existing booking on this property (${clash.start_date} to ${clash.end_date}, ${clash.who}). Nothing was saved.`,
            },
            { status: 409 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Could not check availability, so nothing was saved. Try again." },
          { status: 503 }
        );
      }
    }

    // 3. Server-owned timestamps. Never taken from the client.
    if (to === "booked" && !current.confirmed_at) {
      patch.confirmed_at = new Date().toISOString();
    }
    if (to === "cancelled") {
      if (!current.cancelled_at) patch.cancelled_at = new Date().toISOString();
    } else if (current.cancelled_at) {
      // Reinstated. The audit log keeps the history; the column means
      // "currently cancelled since", so it is cleared.
      patch.cancelled_at = null;
    }

    if (to === "booked" && merged.amount_cents === null) {
      warnings.push(MISSING_AMOUNT_WARNING);
    }
  }

  const { data, error } = await supabaseAdmin
    .from(collection)
    .update(patch)
    .eq("id", id)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (collection === "inquiries") {
    if (statusChange) {
      const auditWarning = await recordStatusEvent(
        id,
        statusChange.from,
        statusChange.to,
        ACTOR_ADMIN
      );
      if (auditWarning) warnings.push(auditWarning);
    }

    const sync = await syncBookingForInquiry(id);
    if (!sync.ok) {
      // The inquiry row itself was written, so say so plainly rather than
      // reporting a clean success the calendar does not back up.
      revalidateCollection(collection);
      return NextResponse.json(
        {
          error: sync.reason,
          warnings,
          inquiryUpdated: true,
          calendarUpdated: false,
        },
        { status: sync.kind === "incomplete" ? 409 : 500 }
      );
    }
  }

  revalidateCollection(collection);
  return NextResponse.json({ data, warnings });
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
