import { selectPayments } from "./payments.js";

// Circle's official Stellar Testnet issuers; never identify issued assets by code alone.
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const EURC_ISSUER = "GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO";
const VERIFIED_ISSUERS = { USDC: USDC_ISSUER, EURC: EURC_ISSUER };
const HORIZON = "https://horizon-testnet.stellar.org";

function failure(code, message) {
  return Object.assign(new Error(message), { code });
}

/**
 * Read public Testnet payments until `limit` compatible payments (1–50, default 5) or history's end.
 * pageSize (1–200) permits real pagination checks; signal permits cancellation.
 * Omission counts cover scanned records only, not an account's entire history.
 * This module never signs, submits transactions, follows remote links or changes networks.
 */
export async function fetchPayments(account, { signal, pageSize = 200, limit = 5 } = {}) {
  if (typeof account !== "string" || !/^G[A-Z2-7]{55}$/.test(account)) {
    throw failure("invalid_account", "A public Stellar account address is required");
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 200) {
    throw failure("invalid_page_size", "pageSize must be an integer from 1 to 200");
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw failure("invalid_limit", "limit must be an integer from 1 to 50");
  }
  const records = [];
  let cursor;

  for (;;) {
    signal?.throwIfAborted();
    const url = new URL(`/accounts/${encodeURIComponent(account)}/payments`, HORIZON);
    url.search = new URLSearchParams({
      order: "desc", limit: String(pageSize), include_failed: "false", join: "transactions",
    });
    if (cursor !== undefined) url.searchParams.set("cursor", cursor);

    let response;
    try {
      response = await fetch(url, {
        method: "GET", redirect: "error", credentials: "omit", signal,
        headers: { Accept: "application/hal+json" },
      });
    } catch {
      signal?.throwIfAborted();
      throw failure("network_error", "Unable to query Stellar Testnet");
    }
    if (!response.ok) {
      const code = response.status === 404 ? "account_not_found"
        : response.status === 429 ? "rate_limited" : "network_error";
      throw failure(code, `Horizon request failed (HTTP ${response.status})`);
    }
    let body;
    try {
      body = await response.json();
    } catch {
      signal?.throwIfAborted();
      throw failure("invalid_response", "Horizon returned an invalid JSON response");
    }
    const page = body?._embedded?.records;
    if (!Array.isArray(page)) {
      throw failure("invalid_response", "Horizon returned an invalid payment page");
    }
    if (page.length === 0) {
      return {
        ...selectPayments(records, account, VERIFIED_ISSUERS, { limit }),
        scannedRecords: records.length,
        exhausted: true,
      };
    }
    if (page.some((record) => typeof record?.paging_token !== "string"
      || !/^\d+$/.test(record.paging_token))) {
      throw failure("invalid_response", "Horizon returned an invalid payment token");
    }
    const nextCursor = page.at(-1).paging_token;
    if (cursor !== undefined && BigInt(nextCursor) >= BigInt(cursor)) {
      throw failure("invalid_response", "Horizon payment cursor did not advance");
    }
    cursor = nextCursor;
    records.push(...page);
    const result = selectPayments(records, account, VERIFIED_ISSUERS, { limit });
    if (result.payments.length === limit) {
      return { ...result, scannedRecords: records.length, exhausted: false };
    }
  }
}
