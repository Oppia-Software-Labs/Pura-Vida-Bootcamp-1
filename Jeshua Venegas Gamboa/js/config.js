// Configuración de red. Esta app SOLO usa TESTNET (dinero de prueba, sin valor real).
// Nunca cambies esto a la red principal (mainnet) para practicar.
export const RED = {
  nombre: "TESTNET",
  passphrase: "Test SDF Network ; September 2015", // identifica a la red de pruebas
  horizonUrl: "https://horizon-testnet.stellar.org", // API pública para leer cuentas y enviar transacciones
  friendbotUrl: "https://friendbot.stellar.org", // regala 10 000 XLM de prueba a cuentas nuevas
  explorador: "https://stellar.expert/explorer/testnet", // ver cuentas y transacciones en la web
};

// Una cuenta en Stellar necesita un saldo mínimo (reserva base) para existir: 1 XLM.
export const RESERVA_MINIMA_XLM = 1;
