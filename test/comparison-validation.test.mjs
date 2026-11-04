import assert from "node:assert/strict";
import test from "node:test";
import {
  parseCatalogEntry,
  parseComparisonInput,
} from "../lib/comparison-validation.js";

const validComparison = {
  cover_type: "life",
  cover_amount: 500000,
  age: 40,
  state: "NSW",
  premium_basis: "monthly",
};

test("accepts supported comparison assumptions", () => {
  assert.deepEqual(parseComparisonInput(validComparison), validComparison);
});

test("rejects unsupported, incomplete, and out-of-range comparison assumptions", () => {
  assert.equal(parseComparisonInput({ ...validComparison, age: 17 }), null);
  assert.equal(parseComparisonInput({ ...validComparison, state: "ZZ" }), null);
  assert.equal(parseComparisonInput({ ...validComparison, cover_type: "health" }), null);
  assert.equal(parseComparisonInput({ ...validComparison, cover_amount: Infinity }), null);
});

test("accepts a source-backed catalog entry with optional exact-match premium", () => {
  const entry = {
    provider_name: "Example Provider",
    provider_website_url: "https://example.com",
    product_name: "Example Cover",
    product_summary: "A source-backed product description.",
    cover_type: "life",
    coverage_summary: "Cover summary from the source.",
    source_url: "https://example.com/pds.pdf",
    source_title: "Product disclosure statement",
    effective_from: "2026-01-01",
    effective_to: "",
    facts: [{ key: "exclusions", value: "See the linked source." }],
    premium: {
      ...validComparison,
      premium_amount: 23.45,
    },
  };

  assert.equal(parseCatalogEntry(entry).premium.premium_amount, 23.45);
});

test("rejects unverified URL schemes, impossible dates, and unsupported fact keys", () => {
  const entry = {
    provider_name: "Example Provider",
    product_name: "Example Cover",
    product_summary: "A source-backed product description.",
    cover_type: "life",
    coverage_summary: "Cover summary from the source.",
    source_url: "http://example.com/pds.pdf",
    source_title: "Product disclosure statement",
    effective_from: "2026-02-31",
    facts: [{ key: "made_up", value: "Not supported." }],
  };

  assert.equal(parseCatalogEntry(entry), null);
});
