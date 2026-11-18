# Stellar Universe · Un viaje por lo básico de Stellar

Entregable 1 del **Pura Vida Bootcamp** · Andrés Gabriel Padilla Robles

Una experiencia 3D interactiva que explica los conceptos básicos de Stellar mientras recorres una galaxia en nave espacial. En cada parada aprendes un concepto y, con tu propia wallet, haces algo real en la red de pruebas (**Testnet**).

## El recorrido

| # | Capítulo | Qué haces |
|---|---|---|
| 0 | **Inicio** | Vuelo de entrada sobre una galaxia de 150 000 estrellas que reaccionan al ratón. |
| 1 | **¿Qué es una blockchain?** | Editas un bloque de una cadena de cristal y ves cómo cambia su huella (SHA-256 real) y se rompe la cadena. Si recalculas las huellas, las copias de la red siguen rechazándola. |
| 2 | **¿Qué es Stellar?** | Doce validadores cierran un ledger cada ~5 s. Al apagar nodos y quedar por debajo de dos tercios, la red se detiene. |
| 3 | **Tu cuenta y tus claves** | Conectas **Varial** y nace tu estrella: la capa exterior es tu clave pública y el candado del núcleo, la secreta. |
| 4 | **XLM y la reserva mínima** | Tu estrella está apagada hasta que pides XLM a **Friendbot**: llega un rayo de luz y se enciende. |
| 5 | **Enviar una transacción** | Firmas un pago en Varial. Una esfera de luz viaja de tu estrella a la de destino, escoltada por la nave, y espera en un anillo dorado hasta que la red la confirma. |
| 6 | **Ledger y confirmación** | Ledgers reales de Testnet en vivo. El ledger que confirmó tu pago se une al final de la cadena del capítulo 1. |

También puedes **pilotar la nave** libremente en cualquier momento con el botón "Pilotar nave" o la tecla **C** (W/S acelerar, A/D girar, ↑/↓ morro, Q/E rodar, Shift turbo, F onda expansiva).

## Requisitos

- Node.js 20 o superior.
- La extensión **[Varial](https://varialwallet.com/)** (antes Freighter) en el navegador, con la red cambiada a **Testnet**. Todo el dinero es de prueba.

## Cómo ejecutarla

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Otros comandos:

```bash
npm run lint    # ESLint
npm run build   # build de producción (incluye la comprobación de tipos)
```

## Tecnologías

- **Next.js 16** (App Router) con **TypeScript**.
- **three.js** para la escena 3D: shader de partículas para la galaxia, post-procesado con bloom y geometría propia para la nave, los bloques y las estrellas.
- **@stellar/varial-sdk** (antes `@stellar/freighter-api`) para conectar la wallet y firmar transacciones.
- **@stellar/stellar-sdk** para leer saldos y ledgers desde Horizon Testnet, construir pagos y enviarlos.

## Estructura

```
src/
├── app/                  # página única de Next.js
├── components/           # interfaz: Universe (escena + capítulos) y el panel de cada capítulo
├── lib/stellar.ts        # todo lo que habla con Stellar: saldo, Friendbot, pagos, ledgers
├── story/                # textos de los capítulos, posiciones de la escena y modelo de la blockchain de juguete
├── three/                # motor 3D: galaxia, nave, cadena, red de validadores, estrellas y viaje del pago
└── wallet/               # hooks de Varial, saldo y último ledger
```

## Notas

- La galaxia y la nave parten de un prototipo propio en three.js, portado a TypeScript e integrado en la historia.
- La blockchain del capítulo 1 y los validadores del capítulo 2 son simulaciones didácticas. El consenso real de Stellar (SCP) usa *quorum slices*; aquí se simplifica como "más de dos tercios". Los capítulos 3 a 6 usan la red Testnet real.
- La "cuenta de prueba nueva" del capítulo 5 genera una dirección aleatoria cuya clave secreta se descarta: lo que reciba no se puede gastar.
