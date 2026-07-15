import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

// List of allowed collections to dynamically operate on
const ALLOWED_COLLECTIONS = [
  "properties",
  "services",
  "blog_posts", // Note: The admin frontend calls it blog but table is blog_posts. We'll handle this mapping if necessary, or just use the right table name from the client.
  "team",
  "testimonials",
  "inquiries"
];

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
  const collection = resolvedParams.collection === "blog" ? "blog_posts" : resolvedParams.collection;

  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  // Allow basic sorting
  let query = supabaseAdmin.from(collection).select("*");
  if (searchParams.has("orderColumn")) {
    query = query.order(searchParams.get("orderColumn")!, { ascending: searchParams.get("ascending") !== "false" });
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
  const collection = resolvedParams.collection === "blog" ? "blog_posts" : resolvedParams.collection;
  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  const body = await req.json();
  const { data, error } = await supabaseAdmin.from(collection).insert([body]).select();

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
  const collection = resolvedParams.collection === "blog" ? "blog_posts" : resolvedParams.collection;
  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const body = await req.json();
  const { data, error } = await supabaseAdmin.from(collection).update(body).eq("id", id).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
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
  const collection = resolvedParams.collection === "blog" ? "blog_posts" : resolvedParams.collection;
  if (!ALLOWED_COLLECTIONS.includes(collection)) {
    return NextResponse.json({ error: "Invalid collection" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const { data, error } = await supabaseAdmin.from(collection).delete().eq("id", id).select();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  revalidateCollection(collection);
  return NextResponse.json(data);
}
