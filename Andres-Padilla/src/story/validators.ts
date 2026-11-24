// Validadores de ejemplo del capítulo 2 (tipos de organización ficticios).

export const VALIDATORS = [
  "Exchange · Singapur",
  "Universidad · Buenos Aires",
  "Empresa de pagos · Lagos",
  "Banco · Frankfurt",
  "Fundación · San Francisco",
  "Wallet · São Paulo",
  "Proveedor de nube · Tokio",
  "ONG · Nairobi",
  "Startup · Ciudad de México",
  "Remesas · Manila",
  "Custodio · Zúrich",
  "Comunidad · San José",
];

export const NODE_COUNT = VALIDATORS.length;
/** Simplificación del consenso de Stellar: hace falta más de 2/3 de los nodos. */
export const QUORUM = Math.floor((NODE_COUNT * 2) / 3) + 1;
export const LEDGER_SECONDS = 5;
