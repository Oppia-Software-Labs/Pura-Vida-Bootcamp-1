# Mi primera app en Stellar

**Autor:** Roy Roldan Quiros

App web básica en Stellar que permite conectar una wallet y ver el balance de XLM en Testnet.

## Qué hace

- Botón "Conectar wallet" con Stellar Wallets Kit.
- Muestra la dirección pública del usuario.
- Consulta el balance de XLM en Horizon (Testnet).

## Cómo ejecutarla

    cd Roy-Roldan-Quiros/wallet-app
    npm install
    npm run dev

Abre http://localhost:5173 en un navegador que tenga una wallet de Stellar instalada (por ejemplo Freighter o Varial) configurada en Testnet.

## Tecnologías

- Vite + JavaScript
- @creit.tech/stellar-wallets-kit
- Horizon Testnet

## Cómo usé Stellar Raven

1. Le pregunté cómo conectar una wallet de Stellar en una app web. Me recomendó Stellar Wallets Kit y me mostró el flujo: iniciar el kit, crear el botón y pedir la dirección.
2. Le pregunté cómo leer el balance de XLM de una cuenta en testnet. Me sugirió consultar Horizon con `fetch` y manejar el caso de error 404 (cuenta no creada).

## Qué aprendí

Aprendi qué es una dirección pública.
Tipos de Wallets y como configurarla para modo test y cuando como tener ese cuidado.
Tambien aprendi a instalar Stellar Raven que la verdad nunca lo habia usado ni eschuchado y que chiva que sea tan explicito y tenga tantas herraminetas propias y el como hacer cada cosa solo de leer,entender y ejecutar.
Tambien creo que es fuera de la tarea pero tambein aprendi sobre las diferencias de WEB1,WEB2 Y WEB3 muy chuzo la verdad dan ganas de crear,crear y crear.