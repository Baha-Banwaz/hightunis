import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ACTOR_AUTO_FINISH, qualifiesForAutoFinish } from "@/lib/inquiry-status";

// Marks completed stays as finished. Scheduled daily at 02:00 UTC by
// vercel.json; safe to run by hand at any time.
//
// AUTHENTICATION
// This path is exempt from the admin session gate in proxy.ts, because
// Vercel's scheduler sends no cookie. It authenticates instead with
// CRON_SECRET as a bearer token, which Vercel attaches automatically once
// that variable is set. Without CRON_SECRET the route refuses everything -
// an unauthenticated endpoint here would let anyone mass-transition the
// inquiry list.
//
// SAFETY
// The query filters on status = 'booked', so a cancelled stay can never be
// auto-finished - not by a special case that could later be deleted, but
// because it is never selected in the first place.
//
// The work is set-based and idempotent: a second run finds nothing, and a
// missed run self-heals on the next one. Nothing here touches
// property_bookings; a finished stay keeps its calendar block as the
// historical record, which is what syncBookingForInquiry already does for
// the finished status.

export const dynamic = "force-dynamic";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET is not set - refusing every request");
    return false;
  }

  const provided = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

async function finishCompletedStays(dryRun: boolean) {
  const today = todayISO();

  const { data: due, error: readError } = await supabaseAdmin
    .from("inquiries")
    .select("id, name, status, check_out")
    .eq("status", "booked")
    .lt("check_out", today);

  if (readError) {
    console.error("[cron] could not list completed stays", {
      code: readError.code ?? null,
      message: readError.message,
    });
    return { ok: false as const, error: "Could not read inquiries" };
  }

  // Belt and braces: re-apply the rule in code so the query and the shared
  // definition cannot drift apart unnoticed.
  const rows = (due ?? []).filter((r) =>
    qualifiesForAutoFinish({ status: r.status as string, check_out: r.check_out as string }, today)
  );

  if (rows.length === 0) {
    console.log("[cron] finish-stays: nothing due", { today });
    return { ok: true as const, dryRun, finished: 0, inquiries: [] };
  }

  const ids = rows.map((r) => r.id as string);

  // ?dryRun=1 reports what would change and writes nothing. The scheduled
  // run never passes it; it exists so a destructive job can be inspected
  // before it is trusted.
  if (dryRun) {
    return {
      ok: true as const,
      dryRun: true,
      finished: 0,
      wouldFinish: ids.length,
      inquiries: rows.map((r) => ({ id: r.id, name: r.name, check_out: r.check_out })),
    };
  }

  const { error: updateError } = await supabaseAdmin
    .from("inquiries")
    .update({ status: "finished" })
    .in("id", ids);

  if (updateError) {
    console.error("[cron] could not finish stays", {
      ids,
      code: updateError.code ?? null,
      message: updateError.message,
    });
    return { ok: false as const, error: "Could not update inquiries" };
  }

  // Audit last: a failure here must not stop the transitions, but it must be
  // loud, because an unlogged status change is the thing this table exists
  // to prevent.
  const { error: auditError } = await supabaseAdmin.from("inquiry_status_events").insert(
    ids.map((id) => ({
      inquiry_id: id,
      from_status: "booked",
      to_status: "finished",
      actor: ACTOR_AUTO_FINISH,
      reason: `Check-out before ${today}`,
    }))
  );

  if (auditError) {
    console.error("[cron] TRANSITIONS NOT LOGGED", {
      ids,
      code: auditError.code ?? null,
      message: auditError.message,
    });
  }

  console.log("[cron] finish-stays complete", {
    today,
    finished: ids.length,
    audited: !auditError,
  });

  return {
    ok: true as const,
    dryRun: false,
    finished: ids.length,
    audited: !auditError,
    inquiries: rows.map((r) => ({
      id: r.id,
      name: r.name,
      check_out: r.check_out,
    })),
  };
}

async function handle(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = new URL(req.url).searchParams.get("dryRun") === "1";
  const result = await finishCompletedStays(dryRun);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}

/** Vercel's scheduler issues a GET. */
export async function GET(req: Request) {
  return handle(req);
}

/** For running it by hand without waiting for 02:00. */
export async function POST(req: Request) {
  return handle(req);
}
