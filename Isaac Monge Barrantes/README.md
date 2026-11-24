# 🌴 Propina Pura Vida

**Autor:** Isaac Monge Barrantes · Entregable 1 · Pura Vida Bootcamp

Una app web sencilla para **enviar propinas en XLM** sobre **Stellar Testnet**: a un creador de contenido, a quien te atendió en la soda o a un amigo. Construida con **Stellar Raven** (el MCP oficial de Stellar) como asistente.

## Qué hace

1. **Conectar wallet** (requisito mínimo): usa [Stellar Wallets Kit](https://stellarwalletskit.dev/), así que funciona con Varial (antes Freighter), xBull, Albedo, LOBSTR, Hana, Rabet y otras. Avisa si tu wallet no está en Testnet y recuerda la wallet para reconectar.
2. **Ver tu saldo** de XLM desde Horizon. Si la cuenta aún no existe, la puedes **fondear con Friendbot** con un clic.
3. **Enviar una propina** con montos rápidos (1/5/10/25 XLM) y un mensaje en el memo. Antes de firmar te muestra un resumen. La firma ocurre en tu wallet y luego te da el enlace a la transacción en Stellar Expert.
   - Si el destinatario no existe en Testnet, usa `createAccount` (mínimo 1 XLM) en lugar de `payment`.
   - Traduce los errores comunes de Horizon (saldo insuficiente, reserva, firma cancelada, tx expirada) a mensajes claros.
4. **Movimientos recientes**: propinas enviadas y recibidas, leídas de Horizon.

## Cómo correrla

Requiere **Node.js 22+** (lo exige `@stellar/stellar-sdk` v17).

```bash
cd "Isaac Monge Barrantes"
npm install
npm run dev
```

Abre http://localhost:5173, conecta tu wallet **en Testnet**, fondea con Friendbot y envía una propina.

Para un build de producción: `npm run build && npm run preview`.

## Stack

- React 18 + TypeScript + Vite
- [`@stellar/stellar-sdk`](https://github.com/stellar/js-stellar-sdk) v17: Horizon, construcción de transacciones
- [`@creit.tech/stellar-wallets-kit`](https://github.com/Creit-Tech/Stellar-Wallets-Kit) v2: conexión multi-wallet y firma

## Estructura

```
src/
  lib/stellar.ts           Configuración de Testnet (Horizon, passphrase, Friendbot)
  lib/wallet.ts            Inicialización de Stellar Wallets Kit
  lib/tip.ts               Validación, construcción y envío de la propina
  hooks/useWallet.ts       Conectar / desconectar / firmar
  hooks/useAccount.ts      Saldo y fondeo con Friendbot
  components/              Secciones de la UI (wallet, saldo, propina, historial)
```

## Cómo usé Stellar Raven

Ver [docs/RAVEN.md](docs/RAVEN.md).
