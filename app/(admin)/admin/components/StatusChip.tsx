import {
  INQUIRY_TRANSITIONS,
  isInquiryStatus,
  type InquiryStatus,
} from "@/lib/inquiry-status";

// One definition of how a status looks, shared by the inquiries list and the
// calendar so the two cannot drift.
//
// Sharp corners, uppercase, no pills. The accent is spent on `booked` alone -
// the state that means money - and carries BLACK text: #A8874E against white
// is 3.36:1, which fails AA at this size, while against black it is 6.24:1.

const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: "bg-black text-white",
  contacted: "bg-white text-black border border-black",
  booked: "bg-accent text-black",
  cancelled: "bg-white text-black/40 border border-black/20 line-through",
  finished: "bg-stone text-black/40",
};

const FALLBACK = "bg-white text-black/40 border border-black/20";

export function StatusChip({
  status,
  className = "",
}: {
  status: string | null;
  className?: string;
}) {
  const label = status ?? "unknown";
  const style = isInquiryStatus(status) ? STATUS_STYLES[status] : FALLBACK;

  return (
    <span
      className={`inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-[2px] ${style} ${className}`}
    >
      {label}
    </span>
  );
}

/** Neutral square chip for secondary facts: property name, dates, flags. */
export function MetaChip({
  children,
  tone = "neutral",
  className = "",
  title,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warn";
  className?: string;
  title?: string;
}) {
  const style =
    tone === "warn"
      ? "bg-white text-black border-2 border-accent"
      : "bg-black/5 text-black/60";

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold uppercase tracking-[2px] ${style} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * The statuses this inquiry may legally move to, plus its own.
 *
 * The API enforces the same table and refuses anything else with a 409, so
 * this only spares the user a round trip to be told no. An unknown status
 * (legacy data) falls back to the full list rather than trapping the row.
 */
export function allowedStatusOptions(current: string | null): string[] {
  if (!isInquiryStatus(current)) {
    return ["new", "contacted", "booked", "cancelled", "finished"];
  }
  return [current, ...INQUIRY_TRANSITIONS[current]];
}
