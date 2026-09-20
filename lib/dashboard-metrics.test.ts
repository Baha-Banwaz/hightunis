import { test } from "node:test";
import assert from "node:assert/strict";
import { computeDashboardMetrics, type InquiryRow, type Period } from "./dashboard-metrics.ts";

const PERIOD: Period = { from: "2026-09-01", to: "2026-09-30" };
const TODAY = "2026-09-20";

function row(over: Partial<InquiryRow> = {}): InquiryRow {
  return {
    id: Math.random().toString(36).slice(2),
    status: "booked",
    property_id: "prop-a",
    created_at: "2026-09-05T10:00:00Z",
    check_in: "2026-09-10",
    check_out: "2026-09-15",
    confirmed_at: "2026-09-06T10:00:00Z",
    cancelled_at: null,
    amount_cents: 100000,
    currency: "EUR",
    ...over,
  };
}

const metrics = (rows: InquiryRow[], propertyId?: string) =>
  computeDashboardMetrics(rows, PERIOD, TODAY, propertyId);

test("an empty database produces no figures, not zeros", () => {
  const m = metrics([]);
  for (const f of [m.bookedRevenue, m.realisedRevenue, m.pipeline, m.netBookings]) {
    assert.deepEqual(f.totals, [], "no currency totals");
    assert.equal(f.rows, 0, "no contributing rows");
  }
  assert.equal(m.conversion.rate, null, "a rate with no denominator is null, not 0");
  assert.equal(m.cancellations.rateOfConfirmed, null);
  assert.equal(m.stays.averageNights, null);
  assert.equal(m.leadTimeDays.averageDays, null);
});

test("currencies are never merged into one number", () => {
  const m = metrics([
    row({ amount_cents: 100000, currency: "EUR" }),
    row({ amount_cents: 300000, currency: "TND" }),
    row({ amount_cents: 50000, currency: "EUR" }),
  ]);
  assert.equal(m.bookedRevenue.totals.length, 2);
  const eur = m.bookedRevenue.totals.find((t) => t.currency === "EUR");
  const tnd = m.bookedRevenue.totals.find((t) => t.currency === "TND");
  assert.equal(eur?.cents, 150000);
  assert.equal(tnd?.cents, 300000);
});

test("unpriced bookings are counted but not silently valued at zero", () => {
  const m = metrics([
    row({ amount_cents: 100000 }),
    row({ amount_cents: null }),
    row({ amount_cents: null }),
  ]);
  assert.equal(m.bookedRevenue.rows, 3, "all three qualified");
  assert.equal(m.bookedRevenue.withAmount, 1);
  assert.equal(m.bookedRevenue.missingAmount, 2, "the UI can say '3 bookings, 2 unpriced'");
  assert.equal(m.bookedRevenue.totals[0].cents, 100000, "only the priced one is summed");
});

test("booked revenue is dated by confirmed_at, not created_at", () => {
  // Enquiry arrived in August, confirmed in September: September's revenue.
  const m = metrics([
    row({ created_at: "2026-08-01T10:00:00Z", confirmed_at: "2026-09-06T10:00:00Z" }),
    // Confirmed in August: outside the period entirely.
    row({ created_at: "2026-08-01T10:00:00Z", confirmed_at: "2026-08-20T10:00:00Z" }),
  ]);
  assert.equal(m.bookedRevenue.rows, 1);
});

test("cancelled bookings STAY in booked revenue and are reported separately", () => {
  const m = metrics([
    row({ amount_cents: 100000 }),
    row({ amount_cents: 40000, status: "cancelled", cancelled_at: "2026-09-12T10:00:00Z" }),
  ]);
  // Booked revenue is what was closed; it must not shrink after the fact.
  assert.equal(m.bookedRevenue.totals[0].cents, 140000);
  assert.equal(m.cancellations.totals[0].cents, 40000);
  assert.equal(m.cancellations.rateOfConfirmed, 0.5);
  // Net is the one that nets them off.
  assert.equal(m.netBookings.totals[0].cents, 100000);
  assert.equal(m.netBookings.rows, 1);
});

test("realised revenue needs the stay to have completed", () => {
  const m = metrics([
    row({ check_in: "2026-09-02", check_out: "2026-09-05", amount_cents: 70000 }), // past
    row({ check_in: "2026-09-25", check_out: "2026-09-28", amount_cents: 90000 }), // future
  ]);
  assert.equal(m.realisedRevenue.rows, 1);
  assert.equal(m.realisedRevenue.totals[0].cents, 70000);
});

test("realised revenue does not depend on the auto-finish job running", () => {
  // Still marked booked because the cron has not run. It has still completed.
  const m = metrics([
    row({ status: "booked", check_in: "2026-09-02", check_out: "2026-09-05", amount_cents: 70000 }),
  ]);
  assert.equal(m.realisedRevenue.rows, 1, "check_out < today is the test, not status");
});

test("cancellations are excluded from realised and pipeline", () => {
  const cancelled = {
    status: "cancelled",
    cancelled_at: "2026-09-12T10:00:00Z",
    amount_cents: 80000,
  };
  const past = metrics([row({ ...cancelled, check_in: "2026-09-02", check_out: "2026-09-05" })]);
  assert.equal(past.realisedRevenue.rows, 0);

  const future = metrics([row({ ...cancelled, check_in: "2026-09-25", check_out: "2026-09-28" })]);
  assert.equal(future.pipeline.rows, 0);
});

test("pipeline is confirmed but not yet stayed, dated by check_in", () => {
  const m = metrics([
    row({ check_in: "2026-09-25", check_out: "2026-09-28", amount_cents: 90000 }),
    row({ check_in: "2026-09-02", check_out: "2026-09-05", amount_cents: 70000 }), // already stayed
    row({ check_in: "2026-10-05", check_out: "2026-10-09", amount_cents: 50000 }), // outside period
  ]);
  assert.equal(m.pipeline.rows, 1);
  assert.equal(m.pipeline.totals[0].cents, 90000);
});

test("a stay spanning today counts as pipeline, not realised", () => {
  const m = metrics([row({ check_in: "2026-09-18", check_out: "2026-09-22", amount_cents: 60000 })]);
  assert.equal(m.realisedRevenue.rows, 0, "not finished yet");
  assert.equal(m.pipeline.rows, 1);
});

test("conversion is a cohort of inquiries created in the period", () => {
  const m = metrics([
    row({ created_at: "2026-09-05T10:00:00Z", confirmed_at: "2026-09-06T10:00:00Z" }),
    row({ created_at: "2026-09-07T10:00:00Z", confirmed_at: null, status: "new" }),
    row({ created_at: "2026-09-08T10:00:00Z", confirmed_at: null, status: "contacted" }),
    row({ created_at: "2026-08-01T10:00:00Z", confirmed_at: "2026-09-02T10:00:00Z" }), // other cohort
  ]);
  assert.equal(m.conversion.created, 3);
  assert.equal(m.conversion.confirmed, 1);
  assert.ok(Math.abs(m.conversion.rate! - 1 / 3) < 1e-9);
});

test("nights and lead time work with no amounts at all", () => {
  // The metrics that are useful before anything has been priced.
  const m = metrics([
    row({ amount_cents: null, created_at: "2026-09-01T00:00:00Z", check_in: "2026-09-11", check_out: "2026-09-15" }),
    row({ amount_cents: null, created_at: "2026-09-05T00:00:00Z", check_in: "2026-09-10", check_out: "2026-09-12" }),
  ]);
  assert.equal(m.stays.count, 2);
  assert.equal(m.stays.totalNights, 6);
  assert.equal(m.stays.averageNights, 3);
  assert.equal(m.leadTimeDays.count, 2);
  // 01 Sep -> 11 Sep is 10 days, 05 Sep -> 10 Sep is 5. Mean 7.5.
  assert.equal(m.leadTimeDays.averageDays, 7.5);
});

test("the property filter applies to every figure", () => {
  const rows = [
    row({ property_id: "prop-a", amount_cents: 100000 }),
    row({ property_id: "prop-b", amount_cents: 500000 }),
  ];
  const m = metrics(rows, "prop-a");
  assert.equal(m.bookedRevenue.totals[0].cents, 100000);
  assert.equal(m.stays.count, 1);
  assert.equal(m.byProperty.length, 1);
  assert.equal(m.byProperty[0].propertyId, "prop-a");
});

test("by-property is ordered by nights and reports unpriced rows", () => {
  const m = metrics([
    row({ property_id: "prop-a", check_in: "2026-09-10", check_out: "2026-09-12", amount_cents: null }),
    row({ property_id: "prop-b", check_in: "2026-09-10", check_out: "2026-09-20", amount_cents: 200000 }),
  ]);
  assert.equal(m.byProperty[0].propertyId, "prop-b", "most nights first");
  assert.equal(m.byProperty[0].nights, 10);
  assert.equal(m.byProperty[1].missingAmount, 1);
});

test("a never-confirmed inquiry contributes to no money figure", () => {
  const m = metrics([row({ status: "new", confirmed_at: null, amount_cents: 999999 })]);
  for (const f of [m.bookedRevenue, m.realisedRevenue, m.pipeline, m.netBookings]) {
    assert.equal(f.rows, 0);
  }
  assert.equal(m.newInquiries, 1, "it is still an inquiry");
});
