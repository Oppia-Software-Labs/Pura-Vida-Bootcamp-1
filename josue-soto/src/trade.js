// Turns an assistant proposal into ONE Stellar transaction, has the wallet sign it,
// and submits it to Horizon. Nothing here runs without an explicit user click.
import { Asset, BASE_FEE, Horizon, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { signXdr, walletPassphrase } from "./wallet.js";

// Amounts are 7-decimal fixed point on Stellar.
const fmt = (n) => Number(n).toFixed(7).replace(/\.?0+$/, "");
// Prices are rationals (n/d), not 7-decimal amounts: keep full precision as a plain
// decimal string (no exponent) and let the SDK convert it to n/d.
const fmtPrice = (n) => Number(n).toLocaleString("en-US", { useGrouping: false, maximumSignificantDigits: 15 });

export function parseAsset(str, cfg) {
  const s = String(str).trim();
  if (/^(xlm|native)$/i.test(s)) return Asset.native();
  if (/^usdc$/i.test(s)) return new Asset("USDC", cfg.usdcIssuer);
  const [code, issuer] = s.split(":");
  return new Asset(code, issuer);
}

export function describeOrder(o) {
  const b = o.base.split(":")[0];
  const c = (o.counter ?? "").split(":")[0];
  switch (o.action) {
    case "buy": return `BUY ${fmt(o.amount_base)} ${b} @ ${fmtPrice(o.price)} ${c}`;
    case "sell": return `SELL ${fmt(o.amount_base)} ${b} @ ${fmtPrice(o.price)} ${c}`;
    case "cancel": return `CANCEL offer #${o.offer_id}`;
    case "trust": return `ADD TRUSTLINE ${b}`;
    default: return JSON.stringify(o);
  }
}

export async function toOperation(o, cfg, server) {
  switch (o.action) {
    case "trust":
      return Operation.changeTrust({ asset: parseAsset(o.base, cfg) });
    case "buy":
      // Buy `amount_base` of base, paying with counter; price = counter per base.
      return Operation.manageBuyOffer({
        selling: parseAsset(o.counter, cfg),
        buying: parseAsset(o.base, cfg),
        buyAmount: fmt(o.amount_base),
        price: fmtPrice(o.price),
        offerId: "0",
      });
    case "sell":
      return Operation.manageSellOffer({
        selling: parseAsset(o.base, cfg),
        buying: parseAsset(o.counter, cfg),
        amount: fmt(o.amount_base),
        price: fmtPrice(o.price),
        offerId: "0",
      });
    case "cancel": {
      const offer = await server.offers().offer(o.offer_id).call();
      const asset = (a) => (a.asset_type === "native" ? Asset.native() : new Asset(a.asset_code, a.asset_issuer));
      return Operation.manageSellOffer({
        selling: asset(offer.selling),
        buying: asset(offer.buying),
        amount: "0",
        price: offer.price_r,
        offerId: o.offer_id,
      });
    }
    default:
      throw new Error(`Unknown action ${o.action}`);
  }
}

/** Transaction record from Horizon, or null if it isn't (yet) in a ledger. */
async function lookupTx(server, hash) {
  try {
    return await server.transactions().transaction(hash).call();
  } catch (e) {
    if (e?.response?.status === 404 || e?.name === "NotFoundError") return null;
    throw e;
  }
}

/**
 * Submits a signed XDR. A definite rejection (Horizon returned result codes) clears
 * the pending tx so the proposal can be rebuilt. Any other error means the outcome is
 * unknown: the signed tx is kept on the proposal so the next click reconciles it
 * instead of signing a second transaction.
 */
async function submit(server, cfg, proposal, xdr) {
  const { hash } = proposal.pendingTx;
  try {
    await server.submitTransaction(TransactionBuilder.fromXDR(xdr, cfg.passphrase));
    delete proposal.pendingTx;
    return { hash };
  } catch (e) {
    const codes = e?.response?.data?.extras?.result_codes;
    if (codes) {
      // On a resubmit, tx_bad_seq can mean our own earlier copy just landed.
      if (codes.transaction === "tx_bad_seq") {
        const found = await lookupTx(server, hash).catch(() => null);
        if (found?.successful) { delete proposal.pendingTx; return { hash }; }
      }
      delete proposal.pendingTx;
      throw new Error(`Transaction failed: ${JSON.stringify(codes)}`);
    }
    throw new Error(`Submission outcome unknown (${e.message}). Click again to check its status; it will not create a duplicate.`);
  }
}

/** @returns {Promise<{hash: string}>} */
export async function executeProposal(proposal, cfg, address) {
  const server = new Horizon.Server(cfg.horizonUrl);

  // Reconcile an earlier submission whose outcome is unknown before building anything new.
  const pending = proposal.pendingTx;
  if (pending) {
    const found = await lookupTx(server, pending.hash);
    if (found) {
      delete proposal.pendingTx;
      if (found.successful) return { hash: pending.hash };
      throw new Error(`Transaction ${pending.hash.slice(0, 12)}… was included in a ledger but failed. You can sign the proposal again.`);
    }
    // Not in a ledger yet: resubmit the exact same signed tx while it's still valid.
    if (Date.now() / 1000 <= Number(pending.maxTime) + 30) return submit(server, cfg, proposal, pending.xdr);
    delete proposal.pendingTx; // expired and never included: safe to rebuild
  }

  const walletNet = await walletPassphrase();
  if (walletNet && walletNet !== cfg.passphrase) {
    throw new Error(`Your wallet is on a different network than the app (${proposal.network}). Switch networks in the wallet first.`);
  }
  const account = await server.loadAccount(address);
  const builder = new TransactionBuilder(account, { fee: String(Number(BASE_FEE) * 10), networkPassphrase: cfg.passphrase });
  for (const o of proposal.orders) builder.addOperation(await toOperation(o, cfg, server));
  const tx = builder.setTimeout(180).build();

  const signed = await signXdr(tx.toXDR(), cfg.passphrase, address);
  const signedTx = TransactionBuilder.fromXDR(signed, cfg.passphrase);
  // SDK v17 returns a Uint8Array (not a Buffer), so hex-encode explicitly.
  const hash = Array.from(signedTx.hash(), (b) => b.toString(16).padStart(2, "0")).join("");
  proposal.pendingTx = { xdr: signed, hash, maxTime: signedTx.timeBounds.maxTime };
  return submit(server, cfg, proposal, signed);
}

export async function fundWithFriendbot(address) {
  const r = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`);
  if (!r.ok) throw new Error(`Friendbot error ${r.status} (the account may already be funded)`);
}
