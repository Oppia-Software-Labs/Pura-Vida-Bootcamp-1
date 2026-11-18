# EasyPay

**Cobra aunque no tengas internet.** Proyecto del Task 1 del Pura Vida Bootcamp (Stellar), por Oscar Wu.

## Qué es

EasyPay es el concepto de una app de cobros para negocios pequeños (pulperías, ferias, sodas, food trucks, zonas con mala señal). El comerciante conecta su wallet de Stellar, cobra con un QR de pago y, cuando no hay señal, guarda los cobros para sincronizarlos después.

El proyecto tiene dos partes:

- **Landing** (`#/`): presentación del producto.
- **Dashboard** (`#/app`): la pantalla de trabajo del comerciante, con pestañas **Cobrar**, **Inventario** e **Historial**.

## Qué es real y qué es demo

| Parte | Estado | Detalle |
|---|---|---|
| Conectar wallet | **REAL** | Usa `@creit.tech/stellar-wallets-kit` en **testnet**. Modal propio con las 15 wallets del kit, búsqueda y segundo paso de conexión. La wallet devuelve la clave pública, validada con `@stellar/stellar-sdk`. |
| Saldo de XLM | **REAL** | Se consulta a Horizon testnet. Si la cuenta no está fondeada, se indica. |
| QR de cobro | **REAL (enlace)** | Genera un enlace de pago Stellar válido (SEP-7, `web+stellar:pay`) con destino, monto en XLM y memo de referencia. Una wallet de testnet puede leerlo. |
| Confirmación del pago por QR | **REAL, sin probar** | Con una wallet real, la app consulta Horizon cada 4 s buscando una transacción con el memo de la referencia. No se probó con una wallet con fondos. |
| Wallet de demostración | **DEMO** | Para probar sin instalar nada: genera una dirección de testnet nueva (sin fondos), muestra un saldo de ejemplo y simula la aprobación y el pago del cliente. |
| Tasas de cambio | **DEMO** | ₡520 por USDC y $0,12 por XLM son valores inventados. |
| Cola sin conexión y sincronización | **DEMO** | El interruptor "Sin conexión" guarda el cobro en estado de React. No hay IndexedDB ni Service Worker: al recargar se pierde. "Sincronizar" solo cambia el estado a "En Stellar"; no envía nada a la red. |
| Productos e inventario | **DEMO** | Catálogo de ejemplo, carrito y control de stock en memoria. Cada venta descuenta stock. |

Un cobro sin conexión realmente funcional requeriría pagos firmados por el cliente, persistencia local, manejo de secuencias y reintentos. Nada de eso está implementado.

## Stack

- Vite + React + TypeScript
- `@creit.tech/stellar-wallets-kit` (npm: `@creit.tech/stellar-wallets-kit`)
- `@stellar/stellar-sdk`
- `qrcode.react`, `lucide-react`

Nota: en esta versión del kit, Freighter pasó a llamarse **Varial**.

## Cómo correrlo

Requiere Node 20+.

```bash
cd "Oscar Wu/easypay"
npm install
npm run dev
```

Abre la URL que muestre Vite. Para probar sin una wallet, usa **"Wallet de demostración"** en el modal de conexión. Para probar la conexión real necesitas una wallet compatible configurada en **testnet**.

```bash
npm run build   # compila para producción
```

## Estructura

```
easypay/src/
  Landing.tsx        # landing (bandas de color, números que cuentan)
  AppScreen.tsx      # dashboard: topbar con pestañas y vistas
  WalletModal.tsx    # selector de wallets propio + paso de aprobación + demo
  wallet.ts          # REAL: kit, lista de wallets, conexión, saldo, memo en Horizon
  PayModal.tsx       # QR de cobro (SEP-7), cuenta regresiva, simulación de pago
  ChargeScreen.tsx   # monto libre o productos con carrito
  PaymentsList.tsx   # lista de cobros, filtros, exportar CSV
  InventoryView.tsx  # inventario básico (demo)
  products.ts        # catálogo de ejemplo y reglas de stock
  payments.ts        # tipos, tasas demo, enlace SEP-7, CSV
  SyncBar.tsx        # resumen del día
  CountUp.tsx        # números que cargan
```
