import { test } from "node:test";
import assert from "node:assert/strict";
import { ADMIN_SCHEMAS, parseAdminPayload } from "./validation.ts";

// Run with: npm test   (node:test is built in - no test dependency)
//
// These exist because of a data-loss bug. z.object().partial() makes fields
// optional but leaves .default() in place, so an absent key still resolved to
// its default and Supabase wrote it over a real column:
//
//   {status:"booked"}  ->  {status:"booked", check_in:null, check_out:null}
//   {featured:true}    ->  {featured:true, gallery:[], amenities:[], order:0, published:true}
//
// An update must only ever write the columns the caller actually sent.

test("an update writes only the keys that were sent", () => {
  for (const collection of Object.keys(ADMIN_SCHEMAS)) {
    // One representative single-key payload per collection.
    const single: Record<string, Record<string, unknown>> = {
      properties: { featured: true },
      services: { published: false },
      blog_posts: { published: false },
      team: { name: "A Person" },
      testimonials: { published: false },
      inquiries: { status: "booked" },
      property_bookings: { note: "a note" },
    };

    const payload = single[collection];
    assert.ok(payload, `no sample payload for ${collection}`);

    const result = parseAdminPayload(collection, "update", payload);
    assert.ok(result.ok, `${collection}: expected the payload to validate`);
    assert.deepEqual(
      Object.keys(result.data).sort(),
      Object.keys(payload).sort(),
      `${collection}: update injected keys the caller never sent`
    );
  }
});

test("the reported bug: inline status change does not clear the dates", () => {
  const result = parseAdminPayload("inquiries", "update", { status: "booked" });
  assert.ok(result.ok);
  assert.deepEqual(result.data, { status: "booked" });
  assert.ok(!("check_in" in result.data), "check_in must not be written");
  assert.ok(!("check_out" in result.data), "check_out must not be written");
});

test("a property toggle does not wipe gallery, amenities or order", () => {
  for (const payload of [{ featured: true }, { published: false }]) {
    const result = parseAdminPayload("properties", "update", payload);
    assert.ok(result.ok);
    for (const key of ["gallery", "amenities", "order", "image_url"]) {
      assert.ok(!(key in result.data), `${key} must not be written by ${JSON.stringify(payload)}`);
    }
  }
});

test("a calendar edit does not reset source or orphan the inquiry link", () => {
  const result = parseAdminPayload("property_bookings", "update", {
    property_id: "11111111-1111-4111-8111-111111111111",
    start_date: "2026-10-01",
    end_date: "2026-10-05",
  });
  assert.ok(result.ok);
  assert.ok(!("source" in result.data), "source must not be reset to manual");
  assert.ok(!("inquiry_id" in result.data), "inquiry_id must not be nulled");
});

test("unblanking blog_posts does not null published_at", () => {
  const result = parseAdminPayload("blog_posts", "update", { published: false });
  assert.ok(result.ok);
  assert.ok(!("published_at" in result.data), "published_at must not be nulled");
});

test("create still applies defaults", () => {
  const result = parseAdminPayload("services", "create", {
    title: "Brand Strategy",
    description: "Positioning and identity work.",
  });
  assert.ok(result.ok);
  assert.equal(result.data.published, true);
  assert.equal(result.data.order, 0);
});

test("updates still validate and strip unknown keys", () => {
  const bad = parseAdminPayload("inquiries", "update", { status: "nonsense" });
  assert.ok(!bad.ok);

  // id is not in any schema, so it is stripped, leaving nothing to write.
  const injected = parseAdminPayload("inquiries", "update", {
    id: "00000000-0000-4000-8000-000000000000",
  });
  assert.ok(!injected.ok);
  assert.match(injected.error, /Nothing to update/);
});

test("an empty update is rejected rather than silently writing defaults", () => {
  const result = parseAdminPayload("properties", "update", {});
  assert.ok(!result.ok);
  assert.match(result.error, /Nothing to update/);
});

test("an unknown collection is rejected", () => {
  const result = parseAdminPayload("pg_catalog", "update", { x: 1 });
  assert.ok(!result.ok);
  assert.match(result.error, /Invalid collection/);
});
