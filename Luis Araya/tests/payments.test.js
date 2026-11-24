import assert from "node:assert/strict";
import test from "node:test";
import { describePayment, selectPayments } from "../src/payments.js";

const account = "GACCOUNT";
const issuer = "GVERIFIED_TESTNET_ISSUER";
const eurcIssuer = "GVERIFIED_EURC_TESTNET_ISSUER";
const other = "GCOUNTERPARTY7K2M";

function payment(overrides = {}) {
  return {
    id: "1",
    paging_token: "1",
    type: "payment",
    transaction_successful: true,
    transaction: { operation_count: 1 },
    from: other,
    to: account,
    amount: "25.0000000",
    asset_type: "native",
    created_at: "2026-11-15T10:30:00Z",
    ...overrides,
  };
}

test("returns the five newest compatible payments, not the first five records", () => {
  const records = Array.from({ length: 7 }, (_, i) =>
    payment({ id: String(i + 1), paging_token: String(i + 1) }),
  );
  records.push(payment({ id: "8", paging_token: "8", type: "create_account" }));
  const result = selectPayments(records, account, issuer);
  assert.deepEqual(result.payments.map(({ id }) => id), ["7", "6", "5", "4", "3"]);
  assert.equal(result.omitted, 1);
});

test("recognizes XLM only as native and preserves the exact amount string", () => {
  const result = selectPayments([payment({ amount: "0.0000001" })], account, issuer);
  assert.deepEqual(result.payments[0], {
    id: "1",
    pagingToken: "1",
    direction: "received",
    counterparty: other,
    amount: "0.0000001",
    asset: "XLM",
    createdAt: "2026-11-15T10:30:00Z",
    status: "completed",
  });
  assert.equal(result.omitted, 0);
});

test("recognizes Testnet USDC by both asset code and verified issuer", () => {
  const usdc = payment({
    asset_type: "credit_alphanum4",
    asset_code: "USDC",
    asset_issuer: issuer,
  });
  const result = selectPayments([
    usdc,
    payment({ ...usdc, id: "2", asset_issuer: "GIMPOSTOR" }),
    payment({ ...usdc, id: "3", asset_code: "OTHER" }),
    payment({ id: "4", asset_type: "credit_alphanum4", asset_code: "XLM", asset_issuer: issuer }),
  ], account, issuer);
  assert.equal(result.payments.length, 1);
  assert.equal(result.payments[0].asset, "USDC");
  assert.equal(result.omitted, 3);
});

test("excludes unsuccessful operations, path payments and multi-operation transactions", () => {
  const result = selectPayments([
    payment({ transaction_successful: false }),
    payment({ id: "2", type: "path_payment_strict_send" }),
    payment({ id: "3", type: "path_payment_strict_receive" }),
    payment({ id: "4", transaction: { operation_count: 2 } }),
    payment({ id: "5", transaction: undefined }),
  ], account, issuer);
  assert.deepEqual(result.payments, []);
  assert.equal(result.omitted, 5);
});

test("includes only payments involving the selected account, with the right counterparty", () => {
  const result = selectPayments([
    payment(),
    payment({ id: "2", paging_token: "2", from: account, to: other }),
    payment({ id: "3", paging_token: "3", from: "GUNRELATED", to: other }),
  ], account, issuer);
  assert.equal(result.omitted, 1);
  assert.deepEqual(
    result.payments.map(({ direction, counterparty }) => ({ direction, counterparty })),
    [{ direction: "sent", counterparty: other }, { direction: "received", counterparty: other }],
  );
});

test("orders large paging tokens exactly, without floating-point conversion", () => {
  const result = selectPayments([
    payment({ id: "older", paging_token: "9007199254740992" }),
    payment({ id: "newer", paging_token: "9007199254740993" }),
  ], account, issuer);
  assert.deepEqual(result.payments.map(({ id }) => id), ["newer", "older"]);
});

test("does not mutate fetched records", () => {
  const records = [payment({ paging_token: "2" }), payment()];
  const before = JSON.stringify(records);
  selectPayments(records, account, issuer);
  assert.equal(JSON.stringify(records), before);
});

test("explains received and sent payments without rounding or attributing an identity", () => {
  const date = "15 de noviembre a las 10:30";
  const [received] = selectPayments([payment()], account, issuer).payments;
  assert.equal(
    describePayment(received, { date, accountSuffix: "7K2M" }),
    "Recibiste 25.0000000 XLM el 15 de noviembre a las 10:30. El pago provino de una cuenta terminada en 7K2M y se completó correctamente en la red de pruebas.",
  );
  const [sent] = selectPayments([payment({ from: account, to: other })], account, issuer).payments;
  assert.equal(
    describePayment(sent, { date, accountSuffix: "7K2M" }),
    "Enviaste 25.0000000 XLM el 15 de noviembre a las 10:30. El pago se dirigió a una cuenta terminada en 7K2M y se completó correctamente en la red de pruebas.",
  );
});

test("recognizes verified Testnet EURC by code and issuer and supports configurable selection limit", () => {
  const records = Array.from({ length: 7 }, (_, i) =>
    payment({
      id: String(i + 1),
      paging_token: String(i + 1),
      asset_type: "credit_alphanum4",
      asset_code: "EURC",
      asset_issuer: eurcIssuer,
    }),
  );
  records.push(
    payment({
      id: "8",
      paging_token: "8",
      asset_type: "credit_alphanum4",
      asset_code: "EURC",
      asset_issuer: "GIMPOSTOR",
    }),
  );

  const selected = selectPayments(records, account, { USDC: issuer, EURC: eurcIssuer }, { limit: 7 });
  assert.equal(selected.payments.length, 7);
  assert.equal(selected.payments[0].asset, "EURC");
  assert.equal(selected.omitted, 1);
});

test("preserves baseline string-issuer parity and rejects non-positive or non-integer limits", () => {
  const eurcRecord = payment({
    id: "9",
    paging_token: "9",
    asset_type: "credit_alphanum4",
    asset_code: "EURC",
    asset_issuer: eurcIssuer,
  });
  const legacy = selectPayments([payment(), eurcRecord], account, issuer);
  assert.equal(legacy.payments.length, 1);
  assert.equal(legacy.payments[0].asset, "XLM");
  assert.equal(legacy.omitted, 1);

  for (const badLimit of [0, -1, 1.5, "5", null, Number.NaN, Number.POSITIVE_INFINITY, true]) {
    assert.throws(
      () => selectPayments([payment()], account, { USDC: issuer, EURC: eurcIssuer }, { limit: badLimit }),
      RangeError,
    );
  }
});
