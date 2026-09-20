// The inquiry lifecycle. Shared by the API, the admin UI and the cron job so
// the rules cannot drift between them.
//
// The database enforces the value set too (inquiries_status_check), so a
// status this file does not know about cannot be written by any route.

export const INQUIRY_STATUSES = [
  "new",
  "contacted",
  "booked",
  "cancelled",
  "finished",
] as const;

export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export function isInquiryStatus(value: unknown): value is InquiryStatus {
  return typeof value === "string" && (INQUIRY_STATUSES as readonly string[]).includes(value);
}

/**
 * Allowed transitions.
 *
 *   finished is NOT terminal. Auto-finish acts on dates, so a mistyped
 *   check_out will finish a stay that has not happened; finished -> booked is
 *   the correction path.
 *
 *   cancelled is reinstatable, but reinstating re-blocks the dates, so the
 *   caller must check for clashes first. See assertNoBookingClash in the
 *   admin route: reinstating over someone else's stay is refused.
 *
 *   booked -> contacted is the correction path for a mistaken confirm.
 */
export const INQUIRY_TRANSITIONS: Record<InquiryStatus, readonly InquiryStatus[]> = {
  new: ["contacted", "booked", "cancelled"],
  contacted: ["new", "booked", "cancelled"],
  booked: ["contacted", "cancelled", "finished"],
  cancelled: ["new", "contacted", "booked"],
  finished: ["booked"],
};

/** A no-op change is always allowed; saving an unrelated field must not fail. */
export function canTransition(from: InquiryStatus, to: InquiryStatus): boolean {
  if (from === to) return true;
  return INQUIRY_TRANSITIONS[from].includes(to);
}

export function transitionError(from: InquiryStatus, to: InquiryStatus): string {
  const allowed = INQUIRY_TRANSITIONS[from];
  return allowed.length
    ? `Cannot change status from "${from}" to "${to}". From "${from}" you can go to: ${allowed.join(", ")}.`
    : `"${from}" is a final status and cannot be changed.`;
}

/** Statuses that mean the booking is confirmed, i.e. it occupies dates. */
export const CONFIRMED_STATUSES: readonly InquiryStatus[] = ["booked", "finished"];

/** Who performed a transition. Written to inquiry_status_events.actor. */
export const ACTOR_ADMIN = "admin";
export const ACTOR_AUTO_FINISH = "system:auto-finish";

// ---------------------------------------------------------------------------
// Derived flags. Pure functions of columns that already exist - no cron, no
// stored state, correct the moment they are rendered.
// ---------------------------------------------------------------------------

export interface InquiryFlagInput {
  status: string | null;
  // Optional because the admin's row type marks these optional; a missing
  // value and a null one mean the same thing here.
  check_out?: string | null;
  confirmed_at?: string | null;
  amount_cents?: number | null;
}

/**
 * Still booked after the guest has checked out. Normally the cron clears
 * these; if it is not running, this makes the gap visible instead of silent.
 */
export function isOverdue(inquiry: InquiryFlagInput, today = new Date()): boolean {
  if (inquiry.status !== "booked" || !inquiry.check_out) return false;
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;
  return inquiry.check_out < todayISO;
}

/**
 * Confirmed but carrying no money. Keyed on confirmed_at rather than status so
 * a booking later marked finished - or cancelled, which still counts towards
 * booked revenue - keeps showing the gap.
 */
export function isMissingAmount(inquiry: InquiryFlagInput): boolean {
  return Boolean(inquiry.confirmed_at) && (inquiry.amount_cents ?? null) === null;
}

/**
 * The auto-finish rule, in one place so the cron query, the test and the
 * OVERDUE flag cannot disagree about what "past" means.
 *
 * Only `booked` qualifies. A cancelled stay can never be auto-finished,
 * because the filter is the status itself rather than a special case that
 * someone could later remove.
 */
export function qualifiesForAutoFinish(
  inquiry: { status: string | null; check_out?: string | null },
  todayISO: string
): boolean {
  return (
    inquiry.status === "booked" &&
    typeof inquiry.check_out === "string" &&
    inquiry.check_out < todayISO
  );
}

export const MISSING_AMOUNT_WARNING =
  "Saved as booked with no amount recorded. Revenue figures will exclude this booking until an amount is added.";
