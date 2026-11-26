import { Networks } from "@stellar/stellar-sdk";

// La app trabaja solo en Testnet: el XLM aquí no tiene valor real.
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const EXPLORER_TX_URL = "https://stellar.expert/explorer/testnet/tx/";
export const EXPLORER_ACCOUNT_URL =
  "https://stellar.expert/explorer/testnet/account/";
