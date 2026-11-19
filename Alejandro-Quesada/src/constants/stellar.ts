export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const SOROBAN_RPC_URL = "https://soroban-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const NETWORK = "TESTNET";

// DeFindex USDC vault (PaltaLabs, testnet) — invierte en la estrategia USDC de Blend.
// Fuente: https://github.com/paltalabs/defindex/blob/main/public/testnet.contracts.json
export const VAULT_ADDRESS = "CBMVK2JK6NTOT2O4HNQAIQFJY232BHKGLIMXDVQVHIIZKDACXDFZDWHN";

// USDC de prueba de Blend (activo clásico + su Stellar Asset Contract)
export const USDC_CODE = "USDC";
export const USDC_ISSUER = "GATALTGTWIOT6BUDBCZM3Q4OQ4BO2COLOAZ7IYSKPLC2PMSOPPGF5V56";
export const USDC_CONTRACT = "CAQCFVLOBK5GIULPNZRGATJJMIZL5BSP7X5YJVMGCPTUEPFM4AVSRCJU";
export const USDC_DECIMALS = 7;

// Faucet de Blend testnet (USDC, BLND, wETH, wBTC). No envía CORS, así que el
// navegador lo llama a través de la ruta /api/faucet de Next.js.
export const BLEND_FAUCET_UPSTREAM = "https://ewqw4hx7oa.execute-api.us-east-1.amazonaws.com/getAssets";
export const BLEND_FAUCET_URL = "/api/faucet";
