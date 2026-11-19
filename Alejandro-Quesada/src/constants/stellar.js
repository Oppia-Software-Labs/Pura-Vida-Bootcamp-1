export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const NETWORK = "TESTNET";

// DeFindex USDC vault (PaltaLabs, testnet) — invierte en la estrategia USDC de Blend.
// Fuente: https://github.com/paltalabs/defindex/blob/main/public/testnet.contracts.json
export const VAULT_ADDRESS =
  "CBMVK2JK6NTOT2O4HNQAIQFJY232BHKGLIMXDVQVHIIZKDACXDFZDWHN";

// USDC de prueba de Blend (activo clásico + su Stellar Asset Contract)
export const USDC_CODE = "USDC";
export const USDC_ISSUER = "GATALTGTWIOT6BUDBCZM3Q4OQ4BO2COLOAZ7IYSKPLC2PMSOPPGF5V56";
export const USDC_CONTRACT =
  "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU";
export const USDC_DECIMALS = 7;

// Faucet de Blend testnet (USDC, BLND, wETH, wBTC). No envía CORS, así que
// en dev se llama a través del proxy de Vite (ver vite.config.js).
export const BLEND_FAUCET_URL = "/blend-faucet/getAssets";

// Alias para código existente: el "pool" ahora es el vault de DeFindex.
export const POOL_ADDRESS = VAULT_ADDRESS;

export const MIN_CONTRIBUTION = "1";
export const MAX_CONTRIBUTION = "1000";
