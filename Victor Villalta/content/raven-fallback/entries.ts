import type { Level } from "../../lib/journey.ts";
import type { RavenSource } from "../../lib/raven/shared.ts";

type Help = {
  pregunta: string;
  palabras: string[];
  respuesta: string;
  fuentes: RavenSource[];
};

const networks = { titulo: "Stellar Docs · Redes y Testnet", url: "https://developers.stellar.org/docs/networks" };
const accounts = { titulo: "Stellar Docs · Cuentas", url: "https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts" };
const transactions = { titulo: "Stellar Docs · Transacciones", url: "https://developers.stellar.org/docs/learn/fundamentals/transactions" };
const fees = { titulo: "Stellar Docs · Comisiones", url: "https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering" };
const horizon = { titulo: "Stellar Docs · Horizon", url: "https://developers.stellar.org/docs/data/apis/horizon" };
const freighter = { titulo: "Freighter · Guía para conectar la extensión", url: "https://github.com/stellar/freighter-developer-docs/blob/main/extension/connecting.md" };
const signing = { titulo: "Freighter · Firma de transacciones", url: "https://github.com/stellar/freighter-developer-docs/blob/main/extension/signing.md" };
export const ravenDocs = { titulo: "Stellar Raven · Documentación", url: "https://raven.stellar.org/docs" };

export const helpByLevel: Record<Level, Help[]> = {
  1: [
    {
      pregunta: "¿Qué es Stellar?",
      palabras: ["que es stellar", "blockchain", "red distribuida", "como funciona stellar"],
      respuesta: "Stellar es una red que lleva un registro compartido de cuentas y movimientos. En este viaje la vas a usar para ver un saldo y enviar un pago de práctica. Freighter es la billetera con la que vas a autorizar las acciones.",
      fuentes: [accounts, networks],
    },
    {
      pregunta: "¿Qué es una clave pública?",
      palabras: ["clave publica", "direccion publica", "clave secreta", "frase semilla", "frase de recuperacion"],
      respuesta: "La clave pública es tu dirección en Stellar. Empieza con G y la podés compartir para recibir XLM de prueba. La clave secreta o frase de recuperación te da acceso a la cuenta. Guardala dentro de tu billetera y jamás la pegues en una app o chat.",
      fuentes: [accounts, freighter],
    },
    {
      pregunta: "¿Para qué sirve Testnet?",
      palabras: ["sirve testnet", "que es testnet", "valor", "retirar", "vender", "xlm de prueba", "diferencia de redes"],
      respuesta: "Testnet es la red de prácticas. Sus XLM de prueba se obtienen sin pagar y carecen de valor monetario. No se pueden vender ni retirar a una cuenta bancaria. La red se reinicia de vez en cuando y puede borrar cuentas y movimientos.",
      fuentes: [networks],
    },
  ],
  2: [
    {
      pregunta: "¿Cómo instalo Freighter?",
      palabras: ["instalo", "instalar", "extension", "freighter no aparece", "que es freighter", "navegador"],
      respuesta: "Abrí el sitio oficial de Freighter y seguí el enlace a la extensión de tu navegador de escritorio. Creá o abrí tu billetera dentro de la extensión. Después regresá a Baula Stellar y tocá Conectar Freighter.",
      fuentes: [freighter, { titulo: "Freighter · Sitio oficial", url: "https://www.freighter.app/" }],
    },
    {
      pregunta: "¿Cómo cambio a Testnet?",
      palabras: ["cambio a testnet", "cambiar a testnet", "cambiar de red", "selector", "red equivocada", "otra red"],
      respuesta: "Abrí Freighter, buscá el selector de red y elegí Testnet. Si Testnet no aparece, activá la opción de mostrar redes de prueba en la configuración de la extensión. Volvé a la app con la cuenta que querés usar.",
      fuentes: [freighter, networks],
    },
    {
      pregunta: "¿Qué permiso pide la conexión?",
      palabras: ["permiso", "conectar", "rechace", "rechazo", "desconectar", "autorizar"],
      respuesta: "La conexión permite que la app lea tu dirección pública. La firma de un pago se aprueba más adelante en un cuadro separado de Freighter. Si rechazaste el permiso, podés volver a tocar Conectar Freighter y aprobarlo en la extensión.",
      fuentes: [freighter, signing],
    },
  ],
  3: [
    {
      pregunta: "¿Qué hace Friendbot?",
      palabras: ["friendbot", "fondear", "fondeo", "cuenta nueva", "cuenta no existe", "conseguir xlm"],
      respuesta: "Friendbot registra una cuenta nueva en Testnet y le deposita XLM de prueba gratis. Tocá Fondear con Friendbot y luego revisá el saldo. Solo necesita tu dirección pública.",
      fuentes: [networks, accounts],
    },
    {
      pregunta: "¿Qué es Horizon?",
      palabras: ["horizon", "historial", "hash", "movimientos", "explorador"],
      respuesta: "Horizon es la puerta para consultar datos de Stellar. Baula Stellar lo usa para ver el saldo y las últimas cinco transacciones. El hash identifica un movimiento y el explorador te muestra sus detalles.",
      fuentes: [horizon, transactions],
    },
    {
      pregunta: "¿Cuánto saldo puedo utilizar?",
      palabras: ["saldo", "balance", "reserva minima", "otros activos", "fondos"],
      respuesta: "El saldo muestra cuánto XLM de prueba guarda tu cuenta. Stellar retiene una reserva para mantener la cuenta y sus entradas, y también cobra una comisión por transacción. Por eso la cantidad disponible para enviar puede ser menor que el saldo total.",
      fuentes: [accounts, fees],
    },
  ],
  4: [
    {
      pregunta: "¿Por qué cuesta un fee?",
      palabras: ["fee", "comision", "cuesta", "stroop", "cargo"],
      respuesta: "El fee es la pequeña comisión que la red cobra por procesar una transacción. Baula Stellar te lo muestra antes de firmar. Se cobra en XLM de prueba y necesitás saldo para cubrir tanto el monto como la comisión.",
      fuentes: [fees, transactions],
    },
    {
      pregunta: "¿Qué pasa al firmar el pago?",
      palabras: ["firmar", "firma", "xdr", "construir", "enviar", "envio", "pendiente"],
      respuesta: "Construir prepara el pago. Firmar en Freighter autoriza exactamente ese pago con tu cuenta. Enviar lo lleva a Testnet para que la red lo confirme. Guardá el hash para poder consultar el resultado.",
      fuentes: [transactions, signing],
    },
    {
      pregunta: "¿Por qué el destino es fijo?",
      palabras: ["destino", "receptor", "reinicio", "cuenta destino", "limite", "maximo", "diez"],
      respuesta: "El destino fijo es la cuenta de práctica del proyecto. Podés enviarle hasta 10 XLM de prueba por pago. Si Testnet se reinicia y la borra, la persona que mantiene la app tiene que generar un nuevo destino.",
      fuentes: [networks, accounts],
    },
  ],
};
