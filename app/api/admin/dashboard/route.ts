import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";
import { computeDashboardMetrics, type InquiryRow } from "@/lib/dashboard-metrics";

export const dynamic = "force-dynamic";

const querySchema = z
  .object({
    from: z.iso.date(),
    to: z.iso.date(),
    propertyId: z.union([z.uuid(), z.literal("")]).optional(),
  })
  .refine((v) => v.to >= v.from, {
    message: "The end of the range must be on or after the start",
    path: ["to"],
  });

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export async function GET(req: Request) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    from: searchParams.get("from") ?? "",
    to: searchParams.get("to") ?? "",
    propertyId: searchParams.get("propertyId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 }
    );
  }

  // Service role, so column grants do not apply. amount_cents and the
  // timestamps are never exposed to the browser by any public route.
  const [inquiriesRes, propertiesRes] = await Promise.all([
    supabaseAdmin
      .from("inquiries")
      .select(
        "id, status, property_id, created_at, check_in, check_out, confirmed_at, cancelled_at, amount_cents, currency"
      ),
    supabaseAdmin.from("properties").select("id, name").order("order", { ascending: true }),
  ]);

  if (inquiriesRes.error) {
    console.error("[dashboard] inquiries query failed", {
      code: inquiriesRes.error.code ?? null,
      message: inquiriesRes.error.message,
    });
    return NextResponse.json({ error: "Could not load dashboard data" }, { status: 500 });
  }

  const metrics = computeDashboardMetrics(
    (inquiriesRes.data ?? []) as InquiryRow[],
    { from: parsed.data.from, to: parsed.data.to },
    todayISO(),
    parsed.data.propertyId || null
  );

  const names = new Map(
    (propertiesRes.data ?? []).map((p) => [p.id as string, p.name as string])
  );

  return NextResponse.json(
    {
      period: { from: parsed.data.from, to: parsed.data.to },
      today: todayISO(),
      properties: (propertiesRes.data ?? []).map((p) => ({ id: p.id, name: p.name })),
      metrics: {
        ...metrics,
        byProperty: metrics.byProperty.map((p) => ({
          ...p,
          name: names.get(p.propertyId) ?? "Unknown property",
        })),
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
