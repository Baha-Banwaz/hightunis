import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS, so it must never be bundled for the
// browser. This module is imported only by route handlers under app/api/.
//
// The guard below makes an accidental import from a "use client" component
// fail loudly at runtime instead of silently shipping the key. (The `server-only`
// package would turn this into a build-time error; it is not currently a
// dependency, so this is the no-new-dependency equivalent.)
if (typeof window !== "undefined") {
  throw new Error(
    "lib/supabase-admin.ts was imported in the browser. It holds the Supabase " +
      "service-role key and must only be used in server code."
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY - admin and public API routes will fail."
  );
}

export const supabaseAdmin = createClient(supabaseUrl ?? "", supabaseServiceKey ?? "", {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
