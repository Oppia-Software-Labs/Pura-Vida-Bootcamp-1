import { Horizon, Networks } from "@stellar/stellar-sdk";

// Configuración de Testnet (según la skill `stellar-dev.dapp` de Stellar Raven).
export const config = {
  network: "TESTNET",
  horizonUrl: "https://horizon-testnet.stellar.org",
  networkPassphrase: Networks.TESTNET,
  friendbotUrl: "https://friendbot.stellar.org",
  explorerUrl: "https://stellar.expert/explorer/testnet",
} as const;

export const horizon = new Horizon.Server(config.horizonUrl);

export const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-6)}`;
