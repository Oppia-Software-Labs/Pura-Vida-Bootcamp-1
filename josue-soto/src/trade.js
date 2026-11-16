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

/** @returns {Promise<{hash: string}>} */
export async function executeProposal(proposal, cfg, address) {
  const walletNet = await walletPassphrase();
  if (walletNet && walletNet !== cfg.passphrase) {
    throw new Error(`Your wallet is on a different network than the app (${proposal.network}). Switch networks in the wallet first.`);
  }
  const server = new Horizon.Server(cfg.horizonUrl);
  const account = await server.loadAccount(address);
  const builder = new TransactionBuilder(account, { fee: String(Number(BASE_FEE) * 10), networkPassphrase: cfg.passphrase });
  for (const o of proposal.orders) builder.addOperation(await toOperation(o, cfg, server));
  const tx = builder.setTimeout(180).build();

  const signed = await signXdr(tx.toXDR(), cfg.passphrase, address);
  try {
    const res = await server.submitTransaction(TransactionBuilder.fromXDR(signed, cfg.passphrase));
    return { hash: res.hash };
  } catch (e) {
    const codes = e?.response?.data?.extras?.result_codes;
    throw new Error(codes ? `Transaction failed: ${JSON.stringify(codes)}` : e.message);
  }
}

export async function fundWithFriendbot(address) {
  const r = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`);
  if (!r.ok) throw new Error(`Friendbot error ${r.status} (the account may already be funded)`);
}
