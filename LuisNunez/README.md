# Pura Vida Wallet

Aplicación sencilla para explorar una wallet de Stellar. Conecta Freighter,
consulta el saldo XLM de la cuenta en Horizon y, si usas Testnet, solicita XLM
de prueba con Friendbot.

## Requisitos

- Node.js y npm
- La extensión [Freighter](https://www.freighter.app/) instalada en el navegador

## Iniciar el proyecto

```bash
npm install
npm run dev
```

Para validar la aplicación:

```bash
npm run lint
npm run build
```

## Cómo probarlo

1. Abre Freighter y selecciona Testnet.
2. Conecta la wallet desde la aplicación y autoriza el acceso.
3. Si la cuenta todavía no existe en Testnet, selecciona **Activar cuenta de
   prueba** para solicitar fondos de prueba.
4. Actualiza el saldo o abre la cuenta en Stellar Expert.

La app usa `@stellar/varial-sdk`, el SDK vigente de Freighter, para pedir acceso
a la dirección pública y detectar la red. Lee el saldo desde la URL de Horizon
proporcionada por la wallet. No solicita ni almacena claves privadas.

## Stellar Raven

Para documentar el uso de Stellar Raven durante el desarrollo, puedes pedirle
que revise la integración del SDK y explique cómo se obtiene el saldo de XLM
desde Horizon. Verifica sus sugerencias con la documentación oficial antes de
aplicarlas.
