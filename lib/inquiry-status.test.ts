import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canTransition,
  INQUIRY_STATUSES,
  INQUIRY_TRANSITIONS,
  isInquiryStatus,
  isMissingAmount,
  isOverdue,
  transitionError,
  type InquiryStatus,
} from "./inquiry-status.ts";

test("the five statuses, and nothing else", () => {
  assert.deepEqual([...INQUIRY_STATUSES], [
    "new", "contacted", "booked", "cancelled", "finished",
  ]);
  assert.ok(isInquiryStatus("cancelled"));
  assert.ok(!isInquiryStatus("closed"));      // legacy value
  assert.ok(!isInquiryStatus("in-progress")); // legacy value
  assert.ok(!isInquiryStatus(undefined));
});

test("every transition target is itself a valid status", () => {
  for (const [from, targets] of Object.entries(INQUIRY_TRANSITIONS)) {
    assert.ok(isInquiryStatus(from), `${from} is not a status`);
    for (const to of targets) {
      assert.ok(isInquiryStatus(to), `${from} -> ${to}: ${to} is not a status`);
      assert.notEqual(to, from, `${from} lists itself as a target`);
    }
  }
});

test("a no-op status change is always allowed", () => {
  // Saving an unrelated field must not fail just because status is unchanged.
  for (const s of INQUIRY_STATUSES) {
    assert.ok(canTransition(s, s), `${s} -> ${s} should be allowed`);
  }
});

test("finished is NOT terminal - the auto-finish correction path exists", () => {
  // A mistyped check_out lets the cron finish a stay that has not happened.
  assert.ok(canTransition("finished", "booked"));
  // But finished does not jump straight back to the top of the funnel.
  assert.ok(!canTransition("finished", "new"));
  assert.ok(!canTransition("finished", "contacted"));
  assert.ok(!canTransition("finished", "cancelled"));
});

test("cancelled is reinstatable", () => {
  assert.ok(canTransition("cancelled", "booked"));
  assert.ok(canTransition("cancelled", "contacted"));
  assert.ok(canTransition("cancelled", "new"));
});

test("booked can be corrected, finished or cancelled", () => {
  assert.ok(canTransition("booked", "contacted"), "mistaken confirm");
  assert.ok(canTransition("booked", "finished"));
  assert.ok(canTransition("booked", "cancelled"));
  // A booking does not go straight back to new.
  assert.ok(!canTransition("booked", "new"));
});

test("a fresh inquiry cannot skip to finished", () => {
  assert.ok(!canTransition("new", "finished"));
  assert.ok(!canTransition("contacted", "finished"));
  assert.ok(canTransition("new", "booked"));
  assert.ok(canTransition("new", "cancelled"));
});

test("the refusal message names the legal targets", () => {
  const msg = transitionError("new", "finished");
  assert.match(msg, /from "new" to "finished"/);
  for (const t of INQUIRY_TRANSITIONS.new) assert.match(msg, new RegExp(t));
});

test("overdue: booked with a check-out in the past", () => {
  const today = new Date(2026, 8, 20); // 2026-09-20, local
  const base = { confirmed_at: "2026-07-01T00:00:00Z", amount_cents: null };

  assert.ok(isOverdue({ ...base, status: "booked", check_out: "2026-09-19" }, today));
  assert.ok(!isOverdue({ ...base, status: "booked", check_out: "2026-09-20" }, today),
    "the check-out day itself is not yet overdue");
  assert.ok(!isOverdue({ ...base, status: "booked", check_out: "2026-09-21" }, today));

  // Only booked. A finished or cancelled stay in the past is not overdue.
  for (const status of ["finished", "cancelled", "new", "contacted"]) {
    assert.ok(!isOverdue({ ...base, status, check_out: "2026-01-01" }, today), status);
  }
  assert.ok(!isOverdue({ ...base, status: "booked", check_out: null }, today));
});

test("missing amount: keyed on confirmed_at, not on status", () => {
  const confirmed = "2026-09-01T00:00:00Z";

  assert.ok(isMissingAmount({ status: "booked", check_out: null, confirmed_at: confirmed, amount_cents: null }));
  // Still flagged once finished - realised revenue needs the amount too.
  assert.ok(isMissingAmount({ status: "finished", check_out: null, confirmed_at: confirmed, amount_cents: null }));
  // And once cancelled, because cancelled bookings stay in booked revenue.
  assert.ok(isMissingAmount({ status: "cancelled", check_out: null, confirmed_at: confirmed, amount_cents: null }));

  assert.ok(!isMissingAmount({ status: "booked", check_out: null, confirmed_at: confirmed, amount_cents: 0 }),
    "zero is a recorded amount, not a missing one");
  assert.ok(!isMissingAmount({ status: "new", check_out: null, confirmed_at: null, amount_cents: null }),
    "never confirmed, so nothing is missing");
});

test("no status is stranded: every status is reachable from another", () => {
  const reachable = new Set<InquiryStatus>();
  for (const targets of Object.values(INQUIRY_TRANSITIONS)) {
    for (const t of targets) reachable.add(t);
  }
  for (const s of INQUIRY_STATUSES) {
    if (s === "new") continue; // the entry point
    assert.ok(reachable.has(s), `${s} cannot be reached from any other status`);
  }
});
