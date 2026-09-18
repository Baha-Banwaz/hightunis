import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/admin-session";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
// Per-instance only, but enough to blunt brute force on a single-admin site.
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

const encoder = new TextEncoder();

function constantTimeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length === 0 || bBytes.length === 0) return false;
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < Math.max(aBytes.length, bBytes.length); i++) {
    diff |= aBytes[i % aBytes.length] ^ bBytes[i % bBytes.length];
  }
  return diff === 0;
}

function isThrottled(ip: string): boolean {
  const entry = failedAttempts.get(ip);
  return !!entry && Date.now() <= entry.resetAt && entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string) {
  const entry = failedAttempts.get(ip);
  if (!entry || Date.now() > entry.resetAt) {
    failedAttempts.set(ip, { count: 1, resetAt: Date.now() + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (isThrottled(ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "ADMIN_PASSWORD is not configured" }, { status: 500 });
  }

  let password: unknown;
  try {
    ({ password } = await req.json());
  } catch {
    // fall through to failure below
  }

  if (typeof password !== "string" || !constantTimeEqual(password, expected)) {
    recordFailure(ip);
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  failedAttempts.delete(ip);
  (await cookies()).set(ADMIN_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // strict: the admin is only ever reached by typing the URL or by
    // navigation from within the site, so nothing legitimate needs the
    // cookie on a cross-site request. Also removes the CSRF surface on
    // the /api/admin write routes.
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  // Same attributes as the set above, so the browser actually clears it.
  (await cookies()).set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}
