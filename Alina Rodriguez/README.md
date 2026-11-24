# 🧱 Teja a Teja

**Divide cuentas con amigos y familia, y salda las deudas en XLM sobre Stellar.**

Entregable 1 del Pura Vida Bootcamp · Autora: **Alina Rodríguez**

---

## ¿Qué hace?

Teja a Teja es una app para dividir gastos (como una cena, el súper o un viaje) y llevar la cuenta de quién le debe a quién. Las deudas se pueden pagar con la wallet de Stellar o registrar como pagadas en efectivo.

### Funcionalidades

- **Conexión de wallet** con **Stellar Wallets Kit**: LOBSTR, Varial (antes Freighter), xBull, Albedo, Hana, Rabet y más, en Stellar **Testnet**. Muestra la dirección y el balance, e incluye un botón para obtener XLM de prueba con Friendbot. Para quien conecta su wallet por primera vez, los pasos aparecen uno por línea.
- **Gastos en 25 monedas**: CRC, USD, EUR, **XLM**, **USDC**, MXN, GTQ, COP, BRL, JPY y otras.
- **Siempre se escribe primero el total** de la cuenta, y la app muestra en vivo cuánto **falta por asignar**.
- **Quién pagó**: una sola persona o **varias**, cada una con su monto.
- **4 métodos de división**: partes iguales, montos exactos, porcentaje y shares.
- **Grupos** (familia, roomies, viajes) para no tener que mandar links cada vez.
- **Compensación solo entre dos personas.** Si yo pago una cena de ₡1000 y Andrés un desayuno de ₡500 (ambos entre los dos), la app resta las deudas y queda un solo pago: *Andrés me debe ₡250*. **Nunca** se mezclan las cuentas de todo el grupo, y siempre se ve el desglose de cada gasto.
- **Estados simples**: cada cobro aparece como ✅ *Pagado* o ⏳ *Pendiente*. Las opciones de pago, incluida **registrar pago en efectivo**, están adentro del cobro.
- **Pago con wallet**: si quien paga no tiene la wallet conectada, el botón cambia a **"Conectar wallet"** y abre el selector de wallets. Las que no están instaladas muestran su enlace de instalación.
- **Iconos minimalistas** para grupos y gastos, de trazo y en un solo color.
- **Empieza desde cero**: sin datos de ejemplo, con estados vacíos que guían a la persona.
- **Diseño** minimalista con bento grid y glassmorphism, en tonos sobrios de selva tropical. Se diseñó primero en Claude Design.
- **Links de cobro**: se genera un link con el monto y un memo único (`TT-XXXXXXXX`). Quien debe lo abre, conecta su wallet y paga. La app **detecta el pago sola** en la blockchain, buscando ese memo en Horizon.
- **Conversión a XLM** al precio actual, tomado del **DEX de Stellar** (libro de órdenes XLM/USDC). Las monedas del mundo usan open.er-api.com.

## Cómo usé Stellar Raven

Usé [Stellar Raven](https://raven.stellar.org/), el MCP oficial de Stellar, como asistente durante el desarrollo:

- La guía **`stellar-dev.dapp`** de Raven me recomendó **Stellar Wallets Kit v2** (`StellarWalletsKit.init`, `authModal`, `signTransaction`) para soportar varias wallets, entre ellas LOBSTR, y me mostró cómo construir y enviar pagos con `TransactionBuilder` y Horizon.
- Con la búsqueda en la documentación oficial descubrí que **Freighter ahora se llama Varial** (`@stellar/varial-sdk`), y que el SDK v16+ requiere Node 22 y unificó `stellar-base` dentro de `stellar-sdk`.
- Raven también me indicó el endpoint de Horizon `GET /accounts/{id}/payments` (con `join=transactions` para leer el memo), que uso para detectar automáticamente los pagos recibidos.
- Seguí el *Transaction UX Checklist* de la guía: estado mientras se espera la firma, hash visible, errores claros (firma rechazada, saldo insuficiente, red equivocada, cuenta sin fondos) y protección contra doble envío.

## Tecnologías

- React 19 + TypeScript + Vite
- `@stellar/stellar-sdk` (transacciones y Horizon)
- `@creit.tech/stellar-wallets-kit` (LOBSTR, Varial, xBull, Albedo…)
- `lucide-react` (iconos)
- Los datos se guardan en el navegador (`localStorage`)

## Cómo correrla

Requiere **Node.js 22+**.

```bash
cd "Alina Rodriguez"
npm install
npm run dev
```

Luego abre http://localhost:5173.

### Para probar los pagos

1. Instala una wallet de Stellar en el navegador, por ejemplo **LOBSTR** (extensión) o **Varial**, y crea una cuenta.
2. En la wallet, cambia la red a **Testnet**.
3. En la app ve a **Wallet**, presiona **Conectar wallet**, elige tu wallet y después **Obtener XLM de prueba (Friendbot)**.
4. Crea un grupo, agrega un gasto y abre el cobro en **"Quién le debe a quién"**:
   - Si **tú debes**: paga directo con tu wallet.
   - Si **te deben**: crea el link de cobro y ábrelo con otra cuenta para pagar. En unos segundos aparecerá como ✅ Pagado.
   - O registra el **pago en efectivo** desde adentro del cobro.

## Estructura

```
src/
├── lib/
│   ├── currencies.ts   # monedas, formatos y redondeo
│   ├── rates.ts        # tipos de cambio (open.er-api + DEX de Stellar)
│   ├── ledger.ts       # división de cuentas y deudas entre parejas
│   ├── store.ts        # estado persistido en localStorage
│   ├── stellar.ts      # Wallets Kit, pagos y detección por memo
│   └── router.ts       # rutas y links de cobro
├── components/
│   ├── ui.tsx          # botones, modal, selector de personas, etc.
│   ├── icons.tsx       # iconos para grupos y gastos
│   └── SettleModal.tsx # el cobro entre dos personas
└── pages/              # Inicio, Grupos, Cuentas sueltas, Gasto, Wallet, Pagar
```

## Mejoras futuras

- Base de datos compartida (por ejemplo Supabase) para que todos los miembros vean el grupo en vivo.
- Pagos en USDC.
- Editar gastos ya creados.
