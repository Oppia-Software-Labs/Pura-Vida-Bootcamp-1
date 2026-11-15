# Pura Vida Tips 🌴

Un frasco de propinas sobre **Stellar**: conectas tu wallet y le envías al creador una propina de **1, 5 o 10 XLM**. Al terminar ves "¡Gracias, pura vida!" y el link de la transacción en el explorador.

Funciona en **Testnet** (los XLM no son dinero real). Entregable 1 del Pura Vida Bootcamp, por Jefferson Calderón Mesén.

## Qué hace

- **Conecta y desconecta la wallet** con Stellar Wallets Kit y muestra la dirección abreviada.
- **Muestra tu saldo de XLM**. Si la cuenta todavía no existe, la puedes fondear con Friendbot.
- **Envía la propina:** arma un pago (`Operation.payment` con `Asset.native()`), lo firma con la wallet, lo envía a Horizon Testnet y vuelve a cargar el saldo.
- **Muestra errores claros:** firma rechazada, saldo insuficiente, wallet en otra red o transacción vencida. También evita el doble clic.

El diseño se inspira en la **carreta pintada de Sarchí**: los botones de propina son ruedas de carreta que giran mientras se envía el pago.

## Stack

Vite + React + TypeScript, `@stellar/stellar-sdk` 17.4 y `@creit.tech/stellar-wallets-kit` 2.8.

## Cómo correrlo

```bash
cd Jefferson-Calderon-Mesen
npm install
npm run dev
```

Para probarlo necesitas la extensión **Varial** (antes Freighter) en **Test Net**. Se cambia en: nombre de la cuenta → ⚙️ → Network → *Current Network* → Test Net.

## Cómo usé Raven (MCP stellar-raven)

Usé Raven como asistente para consultar la documentación oficial de Stellar y las guías de desarrollo:

- **Skill `stellar-dev.dapp`:** de aquí salió el patrón para armar, firmar y enviar el pago, y la lista de errores que la app debía manejar.
- **Stellar Docs:** la guía "Connect to the Testnet" me mostró dónde cambiar la wallet a Test Net.

Comparar lo que decía la documentación con lo que tenía instalado me ayudó a resolver varios problemas:

- **Nombre del paquete:** el kit se instala desde npm como `@creit.tech/stellar-wallets-kit`, con punto. Con guion es el nombre en JSR, y en npm da 404.
- **Freighter ahora se llama Varial:** en el modal del kit aparece con ese nombre.
- **Lobstr no sirve para Testnet:** no permite elegir la red, así que la app ya no se rompe si la wallet no informa en qué red está.
- **Errores más fáciles de leer:** el SDK 17 trae `TransactionFailedError.getResultCodes()`, que uso para mostrar mensajes en español.


Prueba 1
Prueba 2
