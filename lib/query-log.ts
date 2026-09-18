import type { PostgrestError } from "@supabase/supabase-js";

// The public pages read with the anon key and fall back to an empty array on
// failure, so a database problem renders as "no content" rather than an error.
// That is the behaviour we want for visitors, but it must not be silent for us.
//
// Call this immediately after any anon-key query, before the `?? []` fallback.
// It changes nothing about what is rendered; it only makes the failure visible
// in the server logs (Vercel > Project > Logs).
//
// The two failures most worth catching here:
//   42501  permission denied for column X of relation Y
//          A column-level SELECT grant is missing. Names the exact column.
//          See supabase-migration-column-privacy.sql.
//   PGRST  connection and schema-cache errors, unapplied migrations.

/** `.single()` matched zero rows. That is the ordinary 404 path, not a fault. */
const NO_ROWS = "PGRST116";

export function logQueryError(
  table: string,
  error: PostgrestError | null
): void {
  if (!error) return;

  // Every unknown slug would otherwise log an error on its way to notFound().
  if (error.code === NO_ROWS) return;

  console.error("[supabase] query failed", {
    table,
    code: error.code ?? null,
    message: error.message,
    details: error.details ?? null,
    hint: error.hint ?? null,
  });
}
