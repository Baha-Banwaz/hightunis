import { test } from "node:test";
import assert from "node:assert/strict";
import { centsToInput, formatMoney, inputToCents, MAX_AMOUNT_CENTS } from "./money.ts";

test("empty means unpriced, not zero", () => {
  // The distinction the dashboard depends on: null is excluded from revenue,
  // 0 is a recorded amount of nothing.
  assert.equal(inputToCents(""), null);
  assert.equal(inputToCents("   "), null);
  assert.equal(inputToCents("0"), 0);
});

test("major units in, minor units out", () => {
  assert.equal(inputToCents("1700"), 170000);
  assert.equal(inputToCents("1700.50"), 170050);
  assert.equal(inputToCents("0.01"), 1);
  assert.equal(inputToCents("1 700"), 170000);
  assert.equal(inputToCents("1,700"), 170000);
  assert.equal(inputToCents("1700,50"), 170050);
});

test("no float drift on the classic offenders", () => {
  assert.equal(inputToCents("1.005"), "invalid", "more than 2dp is rejected, not silently rounded");
  assert.equal(inputToCents("0.07"), 7);
  assert.equal(inputToCents("1.10"), 110);
  assert.equal(inputToCents("19.99"), 1999);
  // 8.165 * 100 is 816.4999... in binary floating point.
  assert.equal(inputToCents("8.16"), 816);
});

test("garbage is rejected rather than coerced", () => {
  for (const bad of ["-1", "abc", "1.2.3", "1e5", "€1700", "NaN", "Infinity", "--5"]) {
    assert.equal(inputToCents(bad), "invalid", bad);
  }
});

test("the int4 ceiling is enforced at the edge", () => {
  assert.equal(inputToCents("21474836.47"), MAX_AMOUNT_CENTS);
  assert.equal(inputToCents("21474836.48"), "invalid");
});

test("round trips", () => {
  for (const cents of [0, 1, 999, 170000, 170050, MAX_AMOUNT_CENTS]) {
    assert.equal(inputToCents(centsToInput(cents)), cents, String(cents));
  }
  assert.equal(centsToInput(null), "");
  assert.equal(centsToInput(undefined), "");
});

test("display drops a meaningless .00 but keeps real minor units", () => {
  assert.match(formatMoney(170000, "EUR"), /1,700/);
  assert.ok(!formatMoney(170000, "EUR").includes(".00"));
  assert.match(formatMoney(170050, "EUR"), /1,700\.50/);
  // An unknown code must not throw.
  assert.ok(formatMoney(1000, "XYZ").length > 0);
});
