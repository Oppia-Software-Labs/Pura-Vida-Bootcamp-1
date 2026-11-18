import { Networks } from "@stellar/stellar-sdk";

export const network = {
  name: "testnet",
  passphrase: Networks.TESTNET,
  horizonUrl: "https://horizon-testnet.stellar.org",
  rpcUrl: "https://soroban-testnet.stellar.org",
  friendbotUrl: "https://friendbot.stellar.org",
} as const;
