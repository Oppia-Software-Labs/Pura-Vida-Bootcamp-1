import { VIEWS, type View } from "./scenes";

export type ChapterId =
  | "intro"
  | "blockchain"
  | "network"
  | "account"
  | "reserve"
  | "transaction"
  | "ledger";

export type Chapter = {
  id: ChapterId;
  /** Nombre corto para la barra de progreso. */
  short: string;
  title: string;
  body: string[];
  view: View;
};

export const CHAPTERS: Chapter[] = [
  {
    id: "intro",
    short: "Inicio",
    title: "Un viaje por Stellar",
    body: [
      "Esta galaxia representa la red de Stellar. En cada parada aprenderás un concepto básico y, con tu propia wallet, harás algo real en la red de pruebas.",
      "Puedes arrastrar para mirar alrededor en cualquier momento, o pilotar la nave tú mismo.",
    ],
    view: VIEWS.intro,
  },
  {
    id: "blockchain",
    short: "Blockchain",
    title: "¿Qué es una blockchain?",
    body: [
      "Una blockchain es un registro de transacciones que comparten muchas computadoras. Las transacciones se agrupan en bloques, y cada bloque guarda la huella (hash) del bloque anterior: por eso quedan encadenados.",
      "Pulsa un bloque y cambia lo que dice. Observa qué le pasa a su huella y al resto de la cadena.",
    ],
    view: VIEWS.blockchain,
  },
  {
    id: "network",
    short: "Stellar",
    title: "¿Qué es Stellar?",
    body: [
      "Stellar es una blockchain pública pensada para pagos: confirma en unos 5 segundos y cada transacción cuesta una fracción de centavo.",
      "No tiene mineros. Una red de validadores independientes —empresas, universidades, organizaciones— se pone de acuerdo sobre cada bloque.",
    ],
    view: VIEWS.network,
  },
  {
    id: "account",
    short: "Cuenta",
    title: "Tu cuenta y tus claves",
    body: [
      "En Stellar, una cuenta es un par de claves. La clave pública (empieza con G) es tu dirección: puedes compartirla para recibir dinero.",
      "La clave secreta firma tus transacciones y nunca debe salir de tu wallet. Varial la guarda por ti.",
    ],
    view: VIEWS.account,
  },
  {
    id: "reserve",
    short: "Reserva",
    title: "XLM y la reserva mínima",
    body: [
      "XLM es la moneda nativa de Stellar. Para que una cuenta exista en la red necesita un saldo mínimo, la reserva, de 1 XLM.",
      "En la red de pruebas (Testnet) puedes pedir XLM gratis a Friendbot para experimentar.",
    ],
    view: VIEWS.reserve,
  },
  {
    id: "transaction",
    short: "Transacción",
    title: "Enviar una transacción",
    body: [
      "Una transacción contiene operaciones —como un pago— y se firma con tu clave secreta. Tu wallet la firma sin revelarla, y la red comprueba que la firma es tuya.",
    ],
    view: VIEWS.transaction,
  },
  {
    id: "ledger",
    short: "Ledger",
    title: "Ledger y confirmación",
    body: [
      "Cada unos 5 segundos, los validadores cierran un nuevo ledger: el bloque de Stellar, con las transacciones recientes.",
      "Cuando tu transacción entra en un ledger, es definitiva: queda encadenada como los bloques del principio.",
    ],
    view: VIEWS.ledger,
  },
];
