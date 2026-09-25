import { test } from "node:test";
import assert from "node:assert/strict";
import { isHomePath } from "./routes.ts";

test("the root, however it is spelled", () => {
  for (const p of ["/", "/index", "/index.html", "//", "/index/"]) {
    assert.ok(isHomePath(p), p);
  }
});

test("the Vercel /index re-render, which is the bug this exists for", () => {
  // The server rendered the home page under /index, so `pathname === "/"`
  // was false and the navbar shipped white over a dark hero.
  assert.ok(isHomePath("/index"));
});

test("query strings and hashes do not change the page", () => {
  assert.ok(isHomePath("/?utm_source=slack"));
  assert.ok(isHomePath("/index?ref=x"));
  assert.ok(isHomePath("/#top"));
});

test("real pages are not the home page", () => {
  for (const p of ["/about", "/listings", "/contact", "/blog", "/privacy",
                   "/listings/villa-azure", "/admin"]) {
    assert.ok(!isHomePath(p), p);
  }
});

test("a page merely starting with the word index is not the root", () => {
  assert.ok(!isHomePath("/indexing"));
  assert.ok(!isHomePath("/index/deeper"));
});

test("fails open to the hero state when identity is unknown", () => {
  // Deliberate: a white bar over the hero is the visible failure; a
  // transparent bar on a white page is the quieter one.
  for (const p of [null, undefined, ""]) {
    assert.ok(isHomePath(p), String(p));
  }
});
