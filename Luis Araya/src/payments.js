/**
 * Select compatible payments (default 5) from already-fetched Horizon records.
 * `issuersOrUsdcIssuer` accepts `{ USDC, EURC }` or a legacy USDC issuer string.
 * `transaction` must contain the joined transaction; unknown operation counts
 * are excluded rather than treating an unverified transaction as compatible.
 * `omitted` covers only the supplied records, not the account's entire history.
 */
export function selectPayments(records, account, issuersOrUsdcIssuer, { limit = 5 } = {}) {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError("limit must be a positive integer");
  }
  const issuers = typeof issuersOrUsdcIssuer === "string"
    ? { USDC: issuersOrUsdcIssuer }
    : issuersOrUsdcIssuer ?? {};
  const payments = [];
  let omitted = 0;

  for (const record of records) {
    const native = record.asset_type === "native";
    const creditCode = record.asset_type === "credit_alphanum4" ? record.asset_code : "";
    const verifiedIssuer = creditCode === "USDC" || creditCode === "EURC" ? issuers[creditCode] : "";
    const verifiedIssuedAsset = Boolean(verifiedIssuer) && record.asset_issuer === verifiedIssuer;
    const involvesAccount = record.from === account || record.to === account;

    if (record.type !== "payment"
      || record.transaction_successful !== true
      || record.transaction?.operation_count !== 1
      || !involvesAccount
      || (!native && !verifiedIssuedAsset)) {
      omitted += 1;
      continue;
    }

    const sent = record.from === account;
    payments.push({
      id: record.id,
      pagingToken: record.paging_token,
      direction: sent ? "sent" : "received",
      counterparty: sent ? record.to : record.from,
      amount: record.amount,
      asset: native ? "XLM" : creditCode,
      createdAt: record.created_at,
      status: "completed",
    });
  }

  payments.sort((left, right) => {
    const a = BigInt(left.pagingToken);
    const b = BigInt(right.pagingToken);
    return a > b ? -1 : a < b ? 1 : 0;
  });

  return { payments: payments.slice(0, limit), omitted };
}

/** Date presentation and address abbreviation remain caller-owned decisions. */
export function describePayment(payment, { date, accountSuffix }) {
  const sent = payment.direction === "sent";
  const action = sent ? "Enviaste" : "Recibiste";
  const origin = sent ? "se dirigió a" : "provino de";
  return `${action} ${payment.amount} ${payment.asset} el ${date}. `
    + `El pago ${origin} una cuenta terminada en ${accountSuffix} `
    + "y se completó correctamente en la red de pruebas.";
}
