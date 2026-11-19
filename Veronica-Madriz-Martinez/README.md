# Sakura Tips · Verónica Madriz Martínez

Entregable 1 del **Pura Vida Bootcamp**: mi primera app en Stellar, construida con **Stellar Raven** (https://raven.stellar.org/) como asistente.

**Sakura Tips** es un "tip jar" en Stellar Testnet: conectas tu wallet, ves tu balance de XLM, fondeas la cuenta con Friendbot y envías propinas en XLM a cualquier dirección, firmando con tu wallet.

## Funcionalidades

- **Conectar wallet** (requisito mínimo): conexión con la extensión **Varial** (antes Freighter), la wallet oficial de la SDF.
- Detección de red: avisa si la wallet no está en Testnet.
- Balance de XLM en vivo desde Horizon Testnet.
- Fondeo de la cuenta con **Friendbot** (10 000 XLM de prueba).
- Envío de pagos en XLM: la app arma la transacción, la wallet la firma y se envía a Horizon. Muestra el hash con link al explorador.

## Stack

- HTML + CSS + JavaScript (ES modules), sin build.
- [`@stellar/stellar-sdk`](https://www.npmjs.com/package/@stellar/stellar-sdk) para armar transacciones y hablar con Horizon.
- [`@stellar/varial-sdk`](https://www.npmjs.com/package/@stellar/varial-sdk) para la wallet (con respaldo a `@stellar/freighter-api`).
- Las librerías se cargan desde el CDN `esm.sh`.

## Cómo correrla

Las extensiones de wallet no inyectan su API en páginas `file://`, así que hay que servirla por HTTP:

```bash
cd Veronica-Madriz-Martinez
npx serve .          # o: python3 -m http.server 5173
```

Abre la URL que te muestre (por ejemplo http://localhost:3000 o http://localhost:5173).

1. Instala la extensión Varial (https://varialwallet.com), crea una cuenta y cámbiala a **Testnet**.
2. Clic en **Conectar wallet** y acepta en la extensión.
3. Si la cuenta es nueva, clic en **Fondear con Friendbot**.
4. Escribe una dirección destino y un monto, y clic en **Enviar propina**.

## Uso de Stellar Raven

En [`RAVEN.md`](./RAVEN.md) documento las consultas que le hice a Raven y qué saqué de cada una.
