import { StellarError } from "./errors.ts";

const TESTNET = Object.freeze({
  horizonUrl: "https://horizon-testnet.stellar.org",
  friendbotUrl: "https://friendbot.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
  explorerUrl: "https://stellar.expert/explorer/testnet",
});

export function testnetConfig() {
  const configured = {
    horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL,
    friendbotUrl: process.env.NEXT_PUBLIC_FRIENDBOT_URL,
    networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE,
  };

  for (const [key, value] of Object.entries(configured)) {
    if (value !== undefined && value !== TESTNET[key as keyof typeof TESTNET]) {
      throw new StellarError("wrong-network", "La configuración no corresponde a Testnet. La operación se detuvo.");
    }
  }

  return TESTNET;
}

export const DESTINATION_ADDRESS =
  process.env.NEXT_PUBLIC_DESTINATION_ADDRESS?.trim() ||
  "GB6UCXBV743SOFAVSCUQEJME2COUQEBRYJZRGZFW6CW3PL6TYQGJXWLY";

export function explorerLink(kind: "account" | "tx", id: string) {
  return `${testnetConfig().explorerUrl}/${kind}/${encodeURIComponent(id)}`;
}
