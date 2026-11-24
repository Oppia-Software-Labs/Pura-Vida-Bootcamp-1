import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { KitEventType } from "@creit.tech/stellar-wallets-kit/types";
import { Networks } from "@stellar/stellar-sdk";

let started = false;

export function ensureWalletKit(): void {
  if (started) return;
  started = true;
  StellarWalletsKit.init({
    modules: defaultModules(),
    network: Networks.TESTNET,
  });
}

export function subscribeWallet(handlers: {
  onAddress: (address: string | null) => void;
  onDisconnect: () => void;
}): () => void {
  ensureWalletKit();

  const offState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
    handlers.onAddress(event.payload.address ?? null);
  });

  const offDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
    handlers.onDisconnect();
  });

  void StellarWalletsKit.getAddress()
    .then(({ address }) => handlers.onAddress(address))
    .catch(() => {
      /* no hay sesión previa */
    });

  return () => {
    offState();
    offDisconnect();
  };
}

export async function connectWallet(): Promise<string> {
  ensureWalletKit();
  const { address } = await StellarWalletsKit.authModal();
  return address;
}

export async function disconnectWallet(): Promise<void> {
  ensureWalletKit();
  await StellarWalletsKit.disconnect();
}

export async function signTestnetTransaction(
  xdr: string,
  address: string,
): Promise<string> {
  ensureWalletKit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: Networks.TESTNET,
    address,
  });
  return signedTxXdr;
}

export function walletErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (message.toLowerCase().includes("closed")) {
      return "Cerraste el selector de wallet. Podés volver a intentar cuando quieras.";
    }
    return message;
  }
  return "No se pudo hablar con la wallet.";
}
