import { test } from "node:test";
import assert from "node:assert/strict";
import {
  colourForProperty,
  layoutWeek,
  PROPERTY_COLOURS,
  weekStartsForMonth,
  type DateSpan,
} from "./calendar-layout.ts";

const b = (id: string, start_date: string, end_date: string): DateSpan => ({ id, start_date, end_date });

// Monday 2026-09-21 .. Sunday 2026-09-27
const WEEK = "2026-09-21";

test("a stay becomes one bar, not one chip per day", () => {
  // bHAa: 22nd to 26th. Four nights: 22, 23, 24, 25.
  const { segments } = layoutWeek([b("x", "2026-09-22", "2026-09-26")], WEEK);
  assert.equal(segments.length, 1, "one segment, not four");
  assert.equal(segments[0].startCol, 2, "Tuesday is column 2");
  assert.equal(segments[0].span, 4, "four nights");
});

test("check-out day is not occupied", () => {
  // The 26th must be free for the next guest to check in.
  const { segments } = layoutWeek([b("x", "2026-09-22", "2026-09-26")], WEEK);
  const s = segments[0];
  assert.equal(s.startCol + s.span - 1, 5, "last occupied column is Friday the 25th");
});

test("back-to-back stays sit side by side in one lane", () => {
  const { segments, lanes } = layoutWeek(
    [b("a", "2026-09-21", "2026-09-24"), b("b", "2026-09-24", "2026-09-27")],
    WEEK
  );
  assert.equal(lanes, 1, "they do not overlap, so they share a lane");
  assert.deepEqual(segments.map((s) => s.lane), [0, 0]);
});

test("overlapping stays stack into separate lanes", () => {
  const { segments, lanes } = layoutWeek(
    [b("a", "2026-09-21", "2026-09-25"), b("b", "2026-09-23", "2026-09-27")],
    WEEK
  );
  assert.equal(lanes, 2);
  assert.notEqual(segments[0].lane, segments[1].lane);
});

test("three overlapping stays need three lanes", () => {
  const { lanes } = layoutWeek(
    [
      b("a", "2026-09-21", "2026-09-27"),
      b("b", "2026-09-22", "2026-09-26"),
      b("c", "2026-09-23", "2026-09-25"),
    ],
    WEEK
  );
  assert.equal(lanes, 3);
});

test("a stay crossing a week boundary is cut and marked on both sides", () => {
  // 2026-09-20 to 2026-09-29 spans three weeks.
  const stay = b("long", "2026-09-20", "2026-09-29");

  const prev = layoutWeek([stay], "2026-09-14").segments[0];
  assert.equal(prev.startCol, 7, "starts Sunday the 20th");
  assert.equal(prev.span, 1);
  assert.equal(prev.continuesBefore, false);
  assert.equal(prev.continuesAfter, true);

  const mid = layoutWeek([stay], WEEK).segments[0];
  assert.equal(mid.startCol, 1, "fills the whole week");
  assert.equal(mid.span, 7);
  assert.equal(mid.continuesBefore, true);
  assert.equal(mid.continuesAfter, true);

  const last = layoutWeek([stay], "2026-09-28").segments[0];
  assert.equal(last.startCol, 1);
  assert.equal(last.span, 1, "Monday the 28th only; the 29th is check-out");
  assert.equal(last.continuesBefore, true);
  assert.equal(last.continuesAfter, false);
});

test("stays outside the week are dropped", () => {
  const { segments } = layoutWeek(
    [b("before", "2026-09-01", "2026-09-10"), b("after", "2026-10-05", "2026-10-09")],
    WEEK
  );
  assert.equal(segments.length, 0);
});

test("a stay ending exactly on the Monday does not appear in that week", () => {
  // end_date is exclusive, so a stay ending on the 21st occupies nothing here.
  const { segments } = layoutWeek([b("x", "2026-09-18", "2026-09-21")], WEEK);
  assert.equal(segments.length, 0);
});

test("lane assignment is stable, not dependent on input order", () => {
  const items = [b("a", "2026-09-21", "2026-09-25"), b("b", "2026-09-23", "2026-09-27")];
  const forwards = layoutWeek(items, WEEK);
  const backwards = layoutWeek([...items].reverse(), WEEK);
  assert.deepEqual(
    forwards.segments.map((s) => [s.item.id, s.lane]),
    backwards.segments.map((s) => [s.item.id, s.lane])
  );
});

test("week starts cover the whole month and begin on Mondays", () => {
  const weeks = weekStartsForMonth(2026, 8); // September 2026
  assert.equal(weeks[0], "2026-08-31", "the Monday before the 1st");
  assert.ok(weeks.includes("2026-09-28"), "the week holding the 30th");
  for (const w of weeks) {
    const [y, m, d] = w.split("-").map(Number);
    assert.equal(new Date(Date.UTC(y, m - 1, d)).getUTCDay(), 1, `${w} is a Monday`);
  }
});

test("a property keeps its colour, and unknown ones do not crash", () => {
  const ids = ["p1", "p2", "p3"];
  assert.deepEqual(colourForProperty("p1", ids), PROPERTY_COLOURS[0]);
  assert.deepEqual(colourForProperty("p2", ids), PROPERTY_COLOURS[1]);
  assert.deepEqual(colourForProperty("p1", ids), PROPERTY_COLOURS[0], "stable");
  assert.ok(colourForProperty("unknown", ids).bg, "falls back rather than throwing");
});

test("more properties than colours wraps instead of running out", () => {
  const many = Array.from({ length: PROPERTY_COLOURS.length + 3 }, (_, i) => `p${i}`);
  for (const id of many) assert.ok(colourForProperty(id, many).bg);
  assert.deepEqual(
    colourForProperty(many[PROPERTY_COLOURS.length], many),
    PROPERTY_COLOURS[0],
    "wraps to the start"
  );
});
