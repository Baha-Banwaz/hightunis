import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

const BUCKET = "media";
const MAX_SIZE = 8 * 1024 * 1024; // 8 MB
const ALLOWED_FOLDERS = ["properties", "services", "blog", "team", "testimonials", "agency", "misc"];

export async function POST(req: Request) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const folderRaw = String(formData.get("folder") ?? "misc");
  const folder = ALLOWED_FOLDERS.includes(folderRaw) ? folderRaw : "misc";
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files received" }, { status: 400 });
  }

  const urls: string[] = [];
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: `${file.name} is not an image` }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `${file.name} is larger than 8 MB` }, { status: 400 });
    }

    const ext =
      (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const base =
      file.name
        .replace(/\.[^.]*$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 40) || "image";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    urls.push(supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }

  return NextResponse.json({ urls });
}
