import { Horizon, Networks, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";

export const STELLAR = {
  network: "Testnet",
  networkPassphrase: Networks.TESTNET,
  horizonUrl: "https://horizon-testnet.stellar.org",
  friendbotUrl: "https://friendbot.stellar.org",
  explorerUrl: "https://stellar.expert/explorer/testnet",
} as const;

export const horizon = new Horizon.Server(STELLAR.horizonUrl);

export function isValidAddress(address: string): boolean {
  return StrKey.isValidEd25519PublicKey(address.trim());
}

export function explorerAccountUrl(address: string): string {
  return `${STELLAR.explorerUrl}/account/${address}`;
}

export function explorerTxUrl(hash: string): string {
  return `${STELLAR.explorerUrl}/tx/${hash}`;
}

export function explorerAssetUrl(assetCode: string, issuer: string): string {
  return `${STELLAR.explorerUrl}/asset/${assetCode}-${issuer}`;
}

export async function submitSignedXdr(
  xdr: string,
): Promise<{ hash: string; ledger: number }> {
  const transaction = TransactionBuilder.fromXDR(
    xdr,
    STELLAR.networkPassphrase,
  );

  const response = await horizon.submitTransaction(transaction);

  return { hash: response.hash, ledger: response.ledger };
}

export async function getNativeBalance(
  address: string,
): Promise<string | null> {
  try {
    const account = await horizon.loadAccount(address);
    const native = account.balances.find(
      (balance) => balance.asset_type === "native",
    );

    return native?.balance ?? "0";
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      (error as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }

    throw error;
  }
}
