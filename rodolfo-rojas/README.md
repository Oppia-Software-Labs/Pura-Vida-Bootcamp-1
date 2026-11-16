# 👵✨ Abuelita Stellar

> “Si no podés explicarlo de forma simple, es que no lo entendés lo suficiente.” — atribuido a Richard Feynman

**Autor:** Rodolfo Rojas · Pura Vida Bootcamp 1

Wallets, trustlines, burn, smart contracts… Para alguien que viene entrando a la programación (¡o incluso para devs con experiencia!), los conceptos de Stellar y web3 cuestan. Abuelita Stellar los cuenta como un cuento, con cosas de la vida diaria en Costa Rica: la pulpería, el bus, el SINPE Móvil y una máquina de refrescos. Y no se queda en la teoría: cada concepto se prueba en testnet con tu propia wallet.

## Qué hace

| Sección | Qué podés hacer |
|---|---|
| 👛 **Conectá tu wallet** | Conectás Varial (antes Freighter), xBull, LOBSTR o Albedo con Stellar Wallets Kit. Ves tu dirección y tu saldo, y si tu cuenta está vacía, el “abuelo Friendbot” te regala 10.000 XLM de testnet. |
| 📚 **Los cuentos** | 8 conceptos: Testnet, Wallet y llaves, Transacción, Fee, Asset/Token, Trustline, Mint y Burn, Smart contract. Cada uno trae un dibujo ASCII, una comparación tica y un link a la documentación oficial. |
| 🎭 **¿Quién te lo explica?** | 👵 La abuelita (cero cripto), 🎤 el rapero (corto y con rima) o 🛠️ la product engineer (con el código real de `@stellar/stellar-sdk`). |
| 🧪 **Probalo en testnet** | Mandale 1 XLM a Doña Rosa y mirá cuánto pagaste de “pasaje” (fee). Abrí la Pulpería Chepe: creá una trustline, recibí 100 vales `CHEPE` (mint) y quemá 10 (burn). |
| 🧠 **Ahora explicámelo vos** | El corazón de la técnica de Feynman: escribís el concepto con tus palabras y la IA te dice ✅ / 🟡 / ❌, qué te faltó, y qué te preguntaría tu abuela. |
| 💬 **Preguntale a la abuelita** | Preguntás lo que sea de Stellar (anchors, SEP-24, liquidity pools…) y te responde el personaje que escogiste, basado en la documentación oficial. |

## Cómo correrla

Necesitás Node 22+.

```bash
cd rodolfo-rojas
npm install
npm run dev
```

Abrí http://localhost:5173.

- **Wallet:** instalá [Freighter/Varial](https://www.freighter.app/) o xBull y ponela en **Testnet**.
- **IA (opcional, para el chat y el “explicámelo vos”):** pegá en la app una API key gratis de [Groq](https://console.groq.com/keys) o una de [Claude](https://console.anthropic.com/settings/keys). La llave se guarda solo en tu navegador y va directo al proveedor; no hay backend ni `.env`.

## Cómo usé Stellar Raven

[Stellar Raven](https://raven.stellar.org/) fue mi asistente durante todo el desarrollo (conectado como MCP en Claude Code):

1. **Elegir cómo conectar la wallet.** El skill `stellar-dev.dapp` de Raven recomendó Stellar Wallets Kit v2 (que ahora se distribuye en JSR) y me dio la API estática (`StellarWalletsKit.init`, `authModal`, `signTransaction`), además de la configuración de testnet para Horizon y Friendbot.
2. **Verificar cada dato de los cuentos.** Antes de simplificar algo, revisé el dato en la doc oficial con `stellarDocs.search_docs` y `get_doc_page`: el fee mínimo es de 100 stroops, la base reserve es de 0,5 XLM y el saldo mínimo de 1 XLM, burn significa “devolverle el asset al issuer o hacer clawback”, un asset nace cuando el issuer hace un payment, y Soroban usa Rust compilado a WebAssembly. También verifiqué que cada link a la documentación existe.
3. **Armar la base de conocimiento de la IA.** [`src/content/knowledge.ts`](src/content/knowledge.ts) tiene 22 temas (los 8 conceptos más anchors, SEPs, AMMs, SDEX, path payments, sponsored reserves, multisig, memos, consenso, passkeys y RPC vs Horizon), resumidos de lo que Raven trajo de la doc oficial. Con cada pregunta, la app le pasa al modelo los temas que más se parecen, para que no invente números ni nombres técnicos, y muestra los links de donde salió la respuesta.

**Raven en vivo (idea a futuro):** Raven usa OAuth por usuario. Con una API key de operador, un backend pequeño podría darle a la IA las herramientas `search` y `execute` de Raven para responder cualquier pregunta con datos frescos.

## Stack

Vite + React 19 + TypeScript + Tailwind v4 · `@stellar/stellar-sdk` · `@creit-tech/stellar-wallets-kit` · `@anthropic-ai/sdk` / Groq API

```
src/
├── components/   Hero, WalletSection, StoriesSection, TryIt, ExplainBack, AskSection…
├── content/      concepts.ts (los cuentos), personas.ts, knowledge.ts (doc oficial vía Raven)
├── hooks/        useWallet, useDonaRosa, usePulperia, useAiSettings
└── lib/          stellar.ts, transactions.ts, ai.ts, prompts.ts
```

## Notas de seguridad

- Todo corre en **testnet**: es plata de juguete.
- La llave secreta de la Pulpería Chepe se crea en el navegador y vive solo en memoria; si recargás la página, se pierde. Nunca hagás esto en mainnet.
- Tu wallet nunca comparte tu llave secreta: solo firma.
