import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

export async function GET() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = (table: string) =>
    supabaseAdmin.from(table).select("id", { count: "exact", head: true });

  const [props, svcs, blogs, team, tests, inqs, newInqs] = await Promise.all([
    count("properties"),
    count("services"),
    count("blog_posts"),
    count("team"),
    count("testimonials"),
    count("inquiries"),
    supabaseAdmin
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
  ]);

  return NextResponse.json({
    properties: props.count ?? 0,
    services: svcs.count ?? 0,
    blog: blogs.count ?? 0,
    team: team.count ?? 0,
    testimonials: tests.count ?? 0,
    inquiries: inqs.count ?? 0,
    newInquiries: newInqs.count ?? 0,
  });
}
