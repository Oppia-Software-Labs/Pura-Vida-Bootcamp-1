import { StrKey } from "@stellar/stellar-sdk";
import { testnetConfig } from "./config";
import { StellarError } from "./errors";

export type Wallet = { address: string; testnet: boolean };

function isPublicAddress(address: string) {
  return StrKey.isValidEd25519PublicKey(address);
}

async function walletApi() {
  return import("@stellar/freighter-api");
}

async function readNetwork() {
  const api = await walletApi();
  const network = await api.getNetworkDetails();

  if (network.error || !network.networkPassphrase) {
    throw new StellarError("missing-wallet", "No pudimos leer la red de Freighter. Abrí y desbloqueá tu billetera.");
  }
  return network.networkPassphrase === testnetConfig().networkPassphrase;
}

export async function readWallet(): Promise<Wallet> {
  const api = await walletApi();
  const { address, error } = await api.getAddress();
  if (error || !address || !isPublicAddress(address)) {
    throw new StellarError("missing-wallet", "No pudimos leer tu cuenta. Abrí Freighter o volvé a conectarla.");
  }

  return { address, testnet: await readNetwork() };
}

export async function connectWallet(): Promise<Wallet> {
  const api = await walletApi();
  const connection = await api.isConnected();
  if (!connection.isConnected) {
    throw new StellarError("missing-wallet", "Instalá o habilitá la extensión de Freighter y volvé a intentar.");
  }

  const access = await api.requestAccess();
  if (access.error || !access.address) {
    throw new StellarError("wallet-rejected", "La conexión no se autorizó. Abrí Freighter y aceptá el acceso a tu dirección pública.");
  }
  if (!isPublicAddress(access.address)) {
    throw new StellarError("address", "Freighter no devolvió una dirección pública válida de Stellar.");
  }

  return { address: access.address, testnet: await readNetwork() };
}

export async function requireWalletOnTestnet(expectedAddress: string) {
  const wallet = await readWallet();
  if (!wallet.testnet) {
    throw new StellarError("wrong-network", "Cambiá la red de Freighter a Testnet para continuar.");
  }
  if (wallet.address !== expectedAddress) {
    throw new StellarError("wallet-changed", "Cambiaste de cuenta en Freighter. Volvé a abrir este paso con la cuenta activa.");
  }
  return wallet;
}

export async function signWithFreighter(unsignedXdr: string, address: string) {
  await requireWalletOnTestnet(address);
  const api = await walletApi();
  const result = await api.signTransaction(unsignedXdr, {
    address,
    networkPassphrase: testnetConfig().networkPassphrase,
  });

  if (result.error || !result.signedTxXdr) {
    throw new StellarError("wallet-rejected", "La firma no se aprobó. Revisá la solicitud en Freighter y volvé a intentarlo.");
  }

  await requireWalletOnTestnet(address);
  return result.signedTxXdr;
}
