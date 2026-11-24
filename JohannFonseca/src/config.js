// Configuracion de red Stellar Testnet (consultada via Stellar Raven MCP)
export const STELLAR_CONFIG = {
  NETWORK: "TESTNET",
  NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
  HORIZON_URL: "https://horizon-testnet.stellar.org",
  FRIENDBOT_URL: "https://friendbot.stellar.org",
  EXPLORER_TX_URL: "https://stellar.expert/explorer/testnet/tx",
  EXPLORER_ACCOUNT_URL: "https://stellar.expert/explorer/testnet/account",
};

export const PRESET_BILLS = [
  {
    title: "Pizza & Birras con el Squad",
    total: 120,
    friends: ["Kevin", "Cryz", "Adrian"],
    includeMe: true,
  },
  {
    title: "Cafe & Empanadas Hackathon",
    total: 60,
    friends: ["Jeff", "Kevin"],
    includeMe: true,
  },
  {
    title: "Transporte a Cerro Chirripo",
    total: 250,
    friends: ["Kevin", "Cryz", "Adrian", "Jeff"],
    includeMe: true,
  },
];
