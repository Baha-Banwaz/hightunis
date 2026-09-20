// Turns bookings into continuous bars across a month grid.
//
// A stay is one thing, so it should read as one bar spanning its nights, not
// as a separate chip repeated in every day cell. That means slicing each
// booking at week boundaries and stacking the slices into lanes so overlapping
// stays do not collide.
//
// Dates are half-open: end_date is the check-out day and is NOT occupied, so
// a 22nd-to-26th stay covers four nights, 22/23/24/25, and the 26th is free
// for the next guest.

export interface DateSpan {
  id: string;
  start_date: string;
  end_date: string;
}

export interface Segment<T extends DateSpan> {
  item: T;
  /** 1-based grid column, Monday = 1. */
  startCol: number;
  /** Number of columns to span. */
  span: number;
  /** The stay began before this week, so the bar is cut off on the left. */
  continuesBefore: boolean;
  /** The stay runs past this week. */
  continuesAfter: boolean;
  /** 0-based stacking row within the week. */
  lane: number;
}

const DAY_MS = 86400000;

function parseISO(value: string): number {
  const [y, m, d] = value.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(parseISO(iso) + days * DAY_MS);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

function daysBetween(fromISO: string, toISO: string): number {
  return Math.round((parseISO(toISO) - parseISO(fromISO)) / DAY_MS);
}

/**
 * Slices every booking that touches this week into a positioned segment and
 * assigns lanes so no two segments in the same lane overlap.
 *
 * @param weekStartISO the Monday of the week
 */
export function layoutWeek<T extends DateSpan>(
  items: T[],
  weekStartISO: string
): { segments: Segment<T>[]; lanes: number } {
  const weekEndExclusive = addDaysISO(weekStartISO, 7);

  const raw = items
    .filter((it) => it.start_date < weekEndExclusive && it.end_date > weekStartISO)
    .map((it) => {
      const startCol = Math.max(0, daysBetween(weekStartISO, it.start_date));
      const endCol = Math.min(7, daysBetween(weekStartISO, it.end_date));
      return {
        item: it,
        startCol,
        span: endCol - startCol,
        continuesBefore: it.start_date < weekStartISO,
        continuesAfter: it.end_date > weekEndExclusive,
      };
    })
    .filter((s) => s.span > 0)
    // Longest first at the same start, so the bar people notice sits on top.
    .sort((a, b) => a.startCol - b.startCol || b.span - a.span || a.item.id.localeCompare(b.item.id));

  // Greedy lane packing: the first lane with room.
  const laneEnds: number[] = [];
  const segments: Segment<T>[] = raw.map((s) => {
    let lane = laneEnds.findIndex((end) => end <= s.startCol);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = s.startCol + s.span;
    return { ...s, startCol: s.startCol + 1, lane };
  });

  return { segments, lanes: laneEnds.length };
}

/** The Mondays covering a month, as ISO dates. */
export function weekStartsForMonth(year: number, month: number): string[] {
  const first = new Date(Date.UTC(year, month, 1));
  const offsetToMonday = (first.getUTCDay() + 6) % 7;
  const firstMonday = new Date(first.getTime() - offsetToMonday * DAY_MS);
  const lastDay = new Date(Date.UTC(year, month + 1, 0));

  const weeks: string[] = [];
  for (let t = firstMonday.getTime(); t <= lastDay.getTime(); t += 7 * DAY_MS) {
    const d = new Date(t);
    weeks.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
        d.getUTCDate()
      ).padStart(2, "0")}`
    );
  }
  return weeks;
}

export { addDaysISO };

// ---------------------------------------------------------------------------
// Colour
// ---------------------------------------------------------------------------

/**
 * Bars are coloured by PROPERTY, not arbitrarily, so the colour means
 * something: every stay at the same villa looks the same all year.
 *
 * The ramp runs from the accent through gold shades to greys and near-black -
 * distinguishable without introducing hues the rest of the site never uses.
 * Every pairing below clears 4.5:1, which the bar labels need at 9px.
 */
export const PROPERTY_COLOURS = [
  { bg: "#A8874E", fg: "#000000" }, // the accent itself      6.2:1
  { bg: "#1A1A1A", fg: "#FFFFFF" }, // near-black            17.4:1
  { bg: "#C9AE7E", fg: "#000000" }, // light gold             9.1:1
  { bg: "#6E5731", fg: "#FFFFFF" }, // deep gold              7.3:1
  { bg: "#767676", fg: "#FFFFFF" }, // mid grey               4.5:1
  { bg: "#E3D5BA", fg: "#000000" }, // sand                  13.2:1
  { bg: "#4A4A4A", fg: "#FFFFFF" }, // charcoal               8.9:1
  { bg: "#8C6F3E", fg: "#FFFFFF" }, // bronze                 4.7:1
] as const;

/** Stable per property: the same villa keeps its colour across months. */
export function colourForProperty(propertyId: string, orderedPropertyIds: string[]) {
  const index = orderedPropertyIds.indexOf(propertyId);
  const safe = index === -1 ? orderedPropertyIds.length : index;
  return PROPERTY_COLOURS[safe % PROPERTY_COLOURS.length];
}
