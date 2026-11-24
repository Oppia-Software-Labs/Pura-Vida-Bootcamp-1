import assert from "node:assert/strict";
import test from "node:test";
import { fetchPayments } from "../src/horizon.js";

const syntheticAccount = `GAAA${"B".repeat(48)}7K2M`;
const liveAccount1 = process.env.RELATA_TEST_ACCOUNT_1 ?? "";
const liveAccount2 = process.env.RELATA_TEST_ACCOUNT_2 ?? "";
const hasLiveAccounts = /^G[A-Z2-7]{55}$/.test(liveAccount1) && /^G[A-Z2-7]{55}$/.test(liveAccount2);

test("rejects an invalid movement limit locally instead of querying Horizon", async () => {
  for (const limit of [0, -1, 51, 1.5, "5", null, Number.NaN, Number.POSITIVE_INFINITY, true]) {
    await assert.rejects(fetchPayments(syntheticAccount, { limit }), { code: "invalid_limit" });
  }
});

test("rejects an invalid page size locally rather than querying Horizon", async () => {
  for (const pageSize of [0, 201, 1.5, -1, "2", null]) {
    await assert.rejects(fetchPayments(syntheticAccount, { pageSize }), { code: "invalid_page_size" });
  }
});

test("rejects URLs and malformed or missing addresses locally", async () => {
  for (const account of ["https://horizon.stellar.org", "", null, "G123", `S${"A".repeat(55)}`]) {
    await assert.rejects(fetchPayments(account), { code: "invalid_account" });
  }
});

test("honors a real AbortController before starting a cancelled request", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    fetchPayments(syntheticAccount, { signal: controller.signal }),
    { name: "AbortError" },
  );
});

test("reads compatible Testnet payments when RELATA_TEST_ACCOUNT_1/2 env vars are provided", {
  skip: !hasLiveAccounts,
  timeout: 30000,
}, async (t) => {
  const firstPage = await fetchPayments(liveAccount1, { limit: 5, signal: t.signal });
  assert.ok(Array.isArray(firstPage.payments));
  assert.ok(firstPage.payments.length <= 5);
  assert.equal(typeof firstPage.omitted, "number");
  assert.equal(typeof firstPage.scannedRecords, "number");
  assert.equal(typeof firstPage.exhausted, "boolean");

  const paged = await fetchPayments(liveAccount2, { pageSize: 2, limit: 5, signal: t.signal });
  assert.ok(Array.isArray(paged.payments));
  assert.ok(paged.payments.length <= 5);
});
