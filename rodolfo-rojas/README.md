# 👵✨ Abuelita Stellar

> “Si no podés explicarlo de forma simple, es que no lo entendés lo suficiente.” — atribuido a Richard Feynman

**Autor:** Rodolfo Rojas · Pura Vida Bootcamp 1

Wallets, trustlines, burn, smart contracts… Para alguien que viene entrando a la programación (¡o incluso para devs con experiencia!), los conceptos de Stellar y web3 cuestan. Abuelita Stellar los cuenta como un cuento, con cosas de la vida diaria en Costa Rica: la pulpería, el bus, el SINPE Móvil y una máquina de refrescos. Y no se queda en la teoría: cada concepto se prueba en testnet con tu propia wallet.

## Qué hace

Es una sola página que se recorre con scroll, como un tutorial, con el estilo pixel de Oppia Climb.

| Paso | Qué pasa |
|---|---|
| **Select your role** | Escogés quién te explica: la abuelita (cero cripto), el rapero (en verso) o la desarrolladora (con el código real de `@stellar/stellar-sdk`). Cada uno tiene su avatar en pixel art. |
| **Conectá tu wallet** | Conectás Varial (antes Freighter), xBull, LOBSTR o Albedo con Stellar Wallets Kit. Si tu cuenta está vacía, Friendbot te regala 10.000 XLM de testnet. Desde aquí aparece la barra de navegación, donde podés cambiar de rol en cualquier momento sin perder tu lugar. |
| **8 conceptos** | Testnet, Wallet y llaves, Transacción, Fee, Asset/Token, Trustline, Mint y Burn y Smart contract. Cada uno tiene una escena en pixel art distinta para cada rol, la explicación en la voz del rol y un link a la documentación oficial. |
| **Práctica por niveles** | Nivel 1: tu primera transacción (a Doña Rosa, a DJ Pacho o a qa-bot, según el rol). Nivel 2, que se desbloquea al terminar el 1: creás tu propio token (`CHEPE`, `TOQUE` o `DEVCRED`) con trustline, mint y burn, paso a paso. |
| **¿Tenés más preguntas?** | Con tu llave de Claude le preguntás lo que sea de Stellar al rol que escogiste. Responde con datos de la documentación oficial y la conversación se borra si cambiás de rol. |

## Cómo correrla

Necesitás Node 22+.

```bash
cd rodolfo-rojas
npm install
npm run dev
```

Abrí http://localhost:5173.

- **Wallet:** instalá [Freighter/Varial](https://www.freighter.app/) o xBull y ponela en **Testnet**.
- **Preguntas (opcional):** pegá en la app tu API key de [Claude](https://console.anthropic.com/settings/keys). La llave se guarda solo en tu navegador y va directo a Anthropic; no hay backend ni `.env`.

## Cómo usé Stellar Raven

[Stellar Raven](https://raven.stellar.org/) fue mi asistente durante todo el desarrollo (conectado como MCP en Claude Code):

1. **Elegir cómo conectar la wallet.** El skill `stellar-dev.dapp` de Raven recomendó Stellar Wallets Kit v2 (que ahora se distribuye en JSR) y me dio la API estática (`StellarWalletsKit.init`, `authModal`, `signTransaction`), además de la configuración de testnet para Horizon y Friendbot.
2. **Verificar cada dato de los cuentos.** Antes de simplificar algo, revisé el dato en la doc oficial con `stellarDocs.search_docs` y `get_doc_page`: el fee mínimo es de 100 stroops, la base reserve es de 0,5 XLM y el saldo mínimo de 1 XLM, burn significa “devolverle el asset al issuer o hacer clawback”, un asset nace cuando el issuer hace un payment, y Soroban usa Rust compilado a WebAssembly. También verifiqué que cada link a la documentación existe.
3. **Armar la base de conocimiento de la IA.** [`src/content/knowledge.ts`](src/content/knowledge.ts) tiene 22 temas (los 8 conceptos más anchors, SEPs, AMMs, SDEX, path payments, sponsored reserves, multisig, memos, consenso, passkeys y RPC vs Horizon), resumidos de lo que Raven trajo de la doc oficial. Con cada pregunta, la app le pasa al modelo los temas que más se parecen, para que no invente números ni nombres técnicos, y muestra los links de donde salió la respuesta.

**Raven en vivo (idea a futuro):** Raven usa OAuth por usuario. Con una API key de operador, un backend pequeño podría darle a la IA las herramientas `search` y `execute` de Raven para responder cualquier pregunta con datos frescos.

## Stack

Vite + React 19 + TypeScript + Tailwind v4 · Geist / Geist Mono / Geist Pixel · `@stellar/stellar-sdk` · `@creit-tech/stellar-wallets-kit` · `@anthropic-ai/sdk`

```
src/
├── components/   RoleSection, WalletSection, NavBar, ConceptsSection, PracticeSection, AskSection, PixelArt…
├── content/      concepts.ts, practice.ts, personas.ts, knowledge.ts (doc oficial vía Raven),
│                 pixel.ts + sprites.ts + scenes.ts (motor y escenas de pixel art por rol)
├── hooks/        useWallet, useFirstPayment, useTokenLab, useActiveSection, useClaudeKey
└── lib/          stellar.ts, transactions.ts, ai.ts, prompts.ts
```

## Notas de seguridad

- Todo corre en **testnet**: es plata de juguete.
- La llave secreta del emisor del token del nivel 2 se crea en el navegador y vive solo en memoria; si recargás la página, se pierde. Nunca hagás esto en mainnet.
- Tu wallet nunca comparte tu llave secreta: solo firma.
