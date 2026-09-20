// Dashboard figures, computed as pure functions so they can be tested without
// a database. The API route fetches rows and calls these; nothing here knows
// about Supabase.
//
// TWO RULES THIS FILE EXISTS TO ENFORCE:
//
//   1. Never merge currencies. Every money figure returns one total PER
//      currency. Adding EUR to TND to produce a single number would be a
//      fabricated figure, and the whole point of these definitions is that
//      each one is traceable to specific rows and a specific date column.
//
//   2. Never show a zero that means "no data". A figure reports how many rows
//      fed it and how many of those had no amount, so the UI can say
//      "no bookings in this period" or "3 bookings, 2 unpriced" instead of
//      rendering a confident 0.

export interface InquiryRow {
  id: string;
  status: string | null;
  property_id: string | null;
  created_at: string;
  check_in: string | null;
  check_out: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  amount_cents: number | null;
  currency: string | null;
}

export interface Period {
  /** inclusive, YYYY-MM-DD */
  from: string;
  /** inclusive, YYYY-MM-DD */
  to: string;
}

export interface MoneyTotal {
  currency: string;
  cents: number;
  count: number;
}

export interface MoneyFigure {
  totals: MoneyTotal[];
  /** Rows that qualified, priced or not. Zero means "no data", not "no money". */
  rows: number;
  withAmount: number;
  missingAmount: number;
}

const EMPTY_FIGURE: MoneyFigure = { totals: [], rows: 0, withAmount: 0, missingAmount: 0 };

/** timestamptz or date -> YYYY-MM-DD. */
export function dateOnly(value: string | null): string | null {
  return value ? value.slice(0, 10) : null;
}

function inPeriod(date: string | null, p: Period): boolean {
  return date !== null && date >= p.from && date <= p.to;
}

function sumMoney(rows: InquiryRow[]): MoneyFigure {
  if (rows.length === 0) return EMPTY_FIGURE;

  const byCurrency = new Map<string, MoneyTotal>();
  let withAmount = 0;

  for (const r of rows) {
    if (r.amount_cents === null || r.amount_cents === undefined) continue;
    withAmount += 1;
    const currency = r.currency || "EUR";
    const entry = byCurrency.get(currency) ?? { currency, cents: 0, count: 0 };
    entry.cents += r.amount_cents;
    entry.count += 1;
    byCurrency.set(currency, entry);
  }

  return {
    totals: [...byCurrency.values()].sort((a, b) => b.cents - a.cents),
    rows: rows.length,
    withAmount,
    missingAmount: rows.length - withAmount,
  };
}

/** Confirmed at any point: booked, finished, or cancelled after confirming. */
const wasConfirmed = (r: InquiryRow) => r.confirmed_at !== null;
const isCancelled = (r: InquiryRow) => r.status === "cancelled";

function nights(r: InquiryRow): number {
  if (!r.check_in || !r.check_out) return 0;
  const ms = Date.parse(r.check_out) - Date.parse(r.check_in);
  return ms > 0 ? Math.round(ms / 86400000) : 0;
}

export interface DashboardMetrics {
  /** Confirmed in the period, dated by confirmed_at. Cancellations INCLUDED:
   *  booked revenue measures what was closed, and removing cancellations
   *  retroactively would rewrite a month weeks after it ended. */
  bookedRevenue: MoneyFigure;
  /** Booked revenue minus the value of the same cohort that later cancelled. */
  netBookings: MoneyFigure;
  /** Stays that have completed, dated by check_out. Cancellations excluded.
   *  Uses check_out < today rather than status = finished, so it stays correct
   *  even if the auto-finish job never runs. */
  realisedRevenue: MoneyFigure;
  /** Confirmed but not yet stayed, dated by check_in. Cancellations excluded. */
  pipeline: MoneyFigure;
  /** Of the cohort confirmed in this period, those now cancelled. */
  cancellations: MoneyFigure & { rateOfConfirmed: number | null };

  newInquiries: number;
  /** Of inquiries created in this period, the share ever confirmed. */
  conversion: { created: number; confirmed: number; rate: number | null };
  /** Stays starting in the period. Needs no amounts, so it works from day one. */
  stays: { count: number; totalNights: number; averageNights: number | null };
  /** check_in minus created_at, in days, for stays starting in the period. */
  leadTimeDays: { count: number; averageDays: number | null };
  byProperty: {
    propertyId: string;
    bookings: number;
    nights: number;
    totals: MoneyTotal[];
    missingAmount: number;
  }[];
}

export function computeDashboardMetrics(
  all: InquiryRow[],
  period: Period,
  todayISO: string,
  propertyId?: string | null
): DashboardMetrics {
  const rows = propertyId ? all.filter((r) => r.property_id === propertyId) : all;

  // --- money -------------------------------------------------------------
  const confirmedCohort = rows.filter((r) => wasConfirmed(r) && inPeriod(dateOnly(r.confirmed_at), period));
  const cancelledFromCohort = confirmedCohort.filter(isCancelled);

  const bookedRevenue = sumMoney(confirmedCohort);
  const cancelledFigure = sumMoney(cancelledFromCohort);

  // Net is the same cohort minus its cancellations, per currency.
  const netTotals = bookedRevenue.totals.map((t) => {
    const lost = cancelledFigure.totals.find((c) => c.currency === t.currency);
    return {
      currency: t.currency,
      cents: t.cents - (lost?.cents ?? 0),
      count: t.count - (lost?.count ?? 0),
    };
  });
  const netRows = confirmedCohort.length - cancelledFromCohort.length;
  const netBookings: MoneyFigure = {
    totals: netRows > 0 ? netTotals : [],
    rows: netRows,
    withAmount: bookedRevenue.withAmount - cancelledFigure.withAmount,
    missingAmount: bookedRevenue.missingAmount - cancelledFigure.missingAmount,
  };

  const realisedRevenue = sumMoney(
    rows.filter(
      (r) =>
        wasConfirmed(r) &&
        !isCancelled(r) &&
        r.check_out !== null &&
        r.check_out < todayISO &&
        inPeriod(r.check_out, period)
    )
  );

  const pipeline = sumMoney(
    rows.filter(
      (r) =>
        r.status === "booked" &&
        r.check_out !== null &&
        r.check_out >= todayISO &&
        inPeriod(r.check_in, period)
    )
  );

  // --- counts ------------------------------------------------------------
  const createdCohort = rows.filter((r) => inPeriod(dateOnly(r.created_at), period));
  const createdConfirmed = createdCohort.filter(wasConfirmed).length;

  const staysStarting = rows.filter(
    (r) => wasConfirmed(r) && !isCancelled(r) && inPeriod(r.check_in, period)
  );
  const totalNights = staysStarting.reduce((sum, r) => sum + nights(r), 0);

  const withLeadTime = staysStarting.filter((r) => r.check_in && r.created_at);
  const leadTotal = withLeadTime.reduce((sum, r) => {
    const days = (Date.parse(r.check_in!) - Date.parse(dateOnly(r.created_at)!)) / 86400000;
    return sum + Math.max(0, Math.round(days));
  }, 0);

  const propertyMap = new Map<string, InquiryRow[]>();
  for (const r of staysStarting) {
    if (!r.property_id) continue;
    propertyMap.set(r.property_id, [...(propertyMap.get(r.property_id) ?? []), r]);
  }

  return {
    bookedRevenue,
    netBookings,
    realisedRevenue,
    pipeline,
    cancellations: {
      ...cancelledFigure,
      rateOfConfirmed:
        confirmedCohort.length > 0 ? cancelledFromCohort.length / confirmedCohort.length : null,
    },
    newInquiries: createdCohort.length,
    conversion: {
      created: createdCohort.length,
      confirmed: createdConfirmed,
      rate: createdCohort.length > 0 ? createdConfirmed / createdCohort.length : null,
    },
    stays: {
      count: staysStarting.length,
      totalNights,
      averageNights: staysStarting.length > 0 ? totalNights / staysStarting.length : null,
    },
    leadTimeDays: {
      count: withLeadTime.length,
      averageDays: withLeadTime.length > 0 ? leadTotal / withLeadTime.length : null,
    },
    byProperty: [...propertyMap.entries()]
      .map(([pid, list]) => {
        const money = sumMoney(list);
        return {
          propertyId: pid,
          bookings: list.length,
          nights: list.reduce((s, r) => s + nights(r), 0),
          totals: money.totals,
          missingAmount: money.missingAmount,
        };
      })
      .sort((a, b) => b.nights - a.nights),
  };
}
