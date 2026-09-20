// amount_cents is stored in minor units so no float ever reaches the database.
// People type major units. These convert at the edge, and only here.

/** int4 ceiling: EUR 21,474,836.47. Ample for a stay, not for a sale. */
export const MAX_AMOUNT_CENTS = 2147483647;

export const SUPPORTED_CURRENCIES = ["EUR", "USD", "GBP", "TND"] as const;

/** Minor units -> what goes in the text input. Empty for "not priced yet". */
export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}

/**
 * Text input -> minor units.
 *   ""        -> null      (deliberately unpriced, not zero)
 *   "1700"    -> 170000
 *   "1 700,5" -> 170050     (spaces and thousands separators tolerated)
 *   anything else -> "invalid"
 */
export function inputToCents(value: string): number | null | "invalid" {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  // Tolerate thousands separators, but a bare comma decimal is ambiguous
  // ("1,5" could be 1.5 or 15) so only strip commas followed by 3 digits.
  const normalised = trimmed.replace(/\s/g, "").replace(/,(?=\d{3}\b)/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalised)) return "invalid";

  const cents = Math.round(Number(normalised) * 100);
  if (!Number.isFinite(cents) || cents < 0 || cents > MAX_AMOUNT_CENTS) return "invalid";
  return cents;
}

/** Minor units -> display. Whole amounts lose the trailing .00. */
export function formatMoney(cents: number, currency = "EUR"): string {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}
