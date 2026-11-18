import {
  Asset,
  BASE_FEE,
  Horizon,
  Networks,
  NotFoundError,
  Operation,
  StrKey,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { StellarWalletsKit, Networks as KitNetworks } from "@creit-tech/stellar-wallets-kit";
import { VarialModule, VARIAL_ID } from "@creit-tech/stellar-wallets-kit/modules/varial";

export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
// USDC de Circle en testnet
export const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export const USDC = new Asset("USDC", USDC_ISSUER);

export const horizon = new Horizon.Server(HORIZON_URL);

// Stellar Wallets Kit v2 es un singleton estático: se inicializa una sola vez.
// Freighter ahora se llama Varial; su módulo en el kit es VarialModule.
StellarWalletsKit.init({
  modules: [new VarialModule()],
  network: KitNetworks.TESTNET,
  selectedWalletId: VARIAL_ID,
});

export async function connectFreighter() {
  StellarWalletsKit.setWallet(VARIAL_ID);
  // fetchAddress pide permiso a la extensión y devuelve la dirección.
  const { address } = await StellarWalletsKit.fetchAddress();
  if (!address) throw new Error("Freighter no devolvió ninguna dirección");
  return address;
}

// Devuelve true si la wallet está en Testnet (compara el passphrase de la red).
export async function isWalletOnTestnet() {
  const { networkPassphrase } = await StellarWalletsKit.getNetwork();
  return networkPassphrase === NETWORK_PASSPHRASE;
}

export async function disconnectWallet() {
  await StellarWalletsKit.disconnect();
}

export async function getBalances(address) {
  try {
    const account = await horizon.loadAccount(address);
    const xlm = account.balances.find((b) => b.asset_type === "native");
    const usdc = account.balances.find(
      (b) => b.asset_code === USDC.getCode() && b.asset_issuer === USDC.getIssuer()
    );
    return {
      funded: true,
      xlm: xlm?.balance ?? "0",
      usdc: usdc ? usdc.balance : null, // null = sin trustline a USDC
    };
  } catch (err) {
    if (err instanceof NotFoundError) return { funded: false, xlm: "0", usdc: null };
    throw err;
  }
}

// Firma con Freighter y envía a Horizon una transacción ya construida.
async function signAndSubmit(tx, address) {
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(tx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address,
  });
  const signed = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  try {
    const res = await horizon.submitTransaction(signed);
    return res.hash;
  } catch (err) {
    const codes = err?.response?.data?.extras?.result_codes;
    if (codes) throw new Error(`Transacción rechazada: ${JSON.stringify(codes)}`);
    throw err;
  }
}

// Agrega la trustline de USDC (changeTrust sin límite = límite máximo).
export async function addUsdcTrustline(address) {
  const account = await horizon.loadAccount(address);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.changeTrust({ asset: USDC }))
    .setTimeout(180)
    .build();
  return signAndSubmit(tx, address);
}

export async function sendXlm(source, destination, amount) {
  if (!StrKey.isValidEd25519PublicKey(destination)) {
    throw new Error("Dirección de destino inválida");
  }
  const account = await horizon.loadAccount(source);

  // Si el destino no existe en testnet hay que crearlo (createAccount, mínimo 1 XLM).
  let destExists = true;
  try {
    await horizon.loadAccount(destination);
  } catch (err) {
    if (err instanceof NotFoundError) destExists = false;
    else throw err;
  }

  const op = destExists
    ? Operation.payment({ destination, asset: Asset.native(), amount })
    : Operation.createAccount({ destination, startingBalance: amount });

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(180)
    .build();

  return signAndSubmit(tx, source);
}
