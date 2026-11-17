import { Horizon, TransactionBuilder, Operation, Asset, Networks, Memo, BASE_FEE } from '@stellar/stellar-sdk';
import { signTransaction } from '@stellar/freighter-api';
import { ORGANIZER } from './events.js';

const server = new Horizon.Server('https://horizon-testnet.stellar.org');

export async function buyTicket(buyer, event) {
  const account = await server.loadAccount(buyer);
  let exists = true;
  try { await server.loadAccount(ORGANIZER); } catch { exists = false; }
  const amount = String(Math.max(event.price, exists ? 0 : 1));
  const op = exists
    ? Operation.payment({ destination: ORGANIZER, asset: Asset.native(), amount })
    : Operation.createAccount({ destination: ORGANIZER, startingBalance: amount });
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(op)
    .addMemo(Memo.text(`TKT-${event.id}`))
    .setTimeout(120)
    .build();
  const signed = await signTransaction(tx.toXDR(), { networkPassphrase: Networks.TESTNET, address: buyer });
  if (signed.error) throw new Error(signed.error.message || String(signed.error));
  const signedTx = TransactionBuilder.fromXDR(signed.signedTxXdr, Networks.TESTNET);
  const res = await server.submitTransaction(signedTx);
  return res.hash;
}
