# UpTeam · Programa de Embajadores con StellarPoints

UpTeam es el panel de administración del programa de embajadores de la comunidad. Permite gestionar embajadores, asignar niveles, sumar o descontar **StellarPoints** según las reglas del programa y canjear premios. Cada movimiento de puntos queda **registrado de forma pública y verificable en la blockchain de Stellar (Testnet)**.

> Los StellarPoints **no se transfieren** como tokens a las billeteras de los embajadores. La blockchain se usa como un **libro de registro inmutable**: cada movimiento deja una huella pública que cualquiera puede auditar en Stellar Explorer.

## Entrega Pura Vida Bootcamp

- **Autor:** Roberto Fernando Bascuñan Garello
- **Conectar wallet:** sección **Wallet Stellar** (`/wallet`), construida con [Stellar Wallets Kit](https://stellarwalletskit.dev/). Soporta Freighter, Varial, xBull, Albedo, LOBSTR y más. Muestra la dirección pública y el saldo en Testnet. Solo lee la cuenta: nunca pide la frase secreta.
- **Stellar Raven:** se usó [Raven](https://raven.stellar.org/), el MCP oficial de Stellar, como asistente para consultar la documentación de Stellar SDK, Horizon Testnet y Stellar Wallets Kit, y para diseñar el registro de StellarPoints con operaciones `manageData` + memo.

### Ejecutar localmente

```bash
cd Roberto-Fernando-Bascunan-Garello
pnpm install
pnpm dev
```

Variables necesarias: `DATABASE_URL` (Postgres/Neon). Opcional: `STELLAR_SECRET_KEY` para firmar los registros en Testnet.

---

## Índice

- [Funcionalidades](#funcionalidades)
- [Cómo funciona en Stellar](#cómo-funciona-en-stellar)
  - [Por qué Stellar](#por-qué-stellar)
  - [La cuenta de registro de la comunidad](#la-cuenta-de-registro-de-la-comunidad)
  - [Anatomía de una transacción](#anatomía-de-una-transacción)
  - [Flujo completo de un movimiento](#flujo-completo-de-un-movimiento)
  - [Cómo verificar un movimiento](#cómo-verificar-un-movimiento)
  - [Estados en la app](#estados-en-la-app)
  - [Costos](#costos)
  - [Seguridad](#seguridad)
  - [Limitaciones de Testnet](#limitaciones-de-testnet)
  - [Pasar a Mainnet](#pasar-a-mainnet)
- [Stack técnico](#stack-técnico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Puesta en marcha local](#puesta-en-marcha-local)
- [Variables de entorno](#variables-de-entorno)

---

## Funcionalidades

| Sección | Ruta | Descripción |
| --- | --- | --- |
| Dashboard | `/` | Métricas generales, distribución por nivel y actividad reciente. |
| Embajadores | `/embajadores` | Listado, búsqueda, importación desde Excel y ficha individual (`/embajadores/[id]`). |
| Niveles | `/niveles` | Explorador, Colaborador, Creador y Líder del ecosistema. Todos inician como **Explorador** y se promueven manualmente. |
| Reglas | `/reglas` | Acciones que suman o descuentan StellarPoints. |
| Premios | `/premios` | Catálogo y canje de premios. |
| Registro | `/registro` | Historial de todos los movimientos con enlace a **Stellar Explorer**. |
| Administración | `/administracion` | Configuración, bitácora de auditoría y **Cuentas Stellar** (clave pública y balance de la cuenta de registro). |

---

## Cómo funciona en Stellar

### Por qué Stellar

- **Transacciones casi gratuitas**: cada registro cuesta 0,00001 XLM (100 stroops).
- **Confirmación en ~5 segundos**, con finalidad inmediata (sin reorganizaciones de bloques).
- **Exploradores públicos** como [stellar.expert](https://stellar.expert/explorer/testnet), donde cualquiera puede auditar el historial sin necesitar una cuenta.
- **Testnet gratuita** con fondeo automático mediante Friendbot, ideal para un piloto.

### La cuenta de registro de la comunidad

La app usa **una única cuenta de Stellar** que actúa como "notario" del programa. Todas las transacciones se firman y envían desde esa cuenta.

1. La primera vez que se registra un movimiento, el servidor genera un par de claves (`Keypair.random()`).
2. Solicita fondos de prueba a **Friendbot** (`https://friendbot.stellar.org/?addr=<clave_pública>`), que deposita 10.000 XLM de testnet.
3. Guarda la clave pública y la secreta **solo en el servidor** (tabla `config_stellar` en Neon, o la variable `STELLAR_SECRET_KEY` si está definida, que tiene prioridad).
4. Las siguientes llamadas reutilizan esa misma cuenta.

La clave pública y el balance actual se pueden ver en **Administración → Cuentas Stellar**, con un enlace directo a la cuenta en Stellar Explorer.

> Los embajadores **no necesitan** cuenta ni billetera de Stellar. Se identifican dentro de la transacción por su ID interno.

### Anatomía de una transacción

Cada movimiento de StellarPoints genera **una transacción** en Stellar Testnet con esta estructura:

| Campo | Valor | Ejemplo |
| --- | --- | --- |
| Red | `Networks.TESTNET` | Test SDF Network ; September 2015 |
| Origen | Cuenta de registro de la comunidad | `GCJM…QKI6` |
| Comisión | `BASE_FEE` (100 stroops) | 0,00001 XLM |
| Memo (texto, máx. 28 bytes) | Puntos con signo | `+10 StellarPoints` |
| Operación | `manageData` | — |
| ↳ nombre (máx. 64 bytes) | Tipo de registro | `StellarPoints` |
| ↳ valor (máx. 64 bytes) | `idMovimiento\|idEmbajador\|puntos` | `mov_123\|emb_45\|+10` |
| Timeout | 60 segundos | — |

Para los **canjes de premios** el formato es el mismo, con memo `Premio <monto> <moneda>` y la entrada `manageData` con nombre `Premio`.

**Por qué `manageData` y no un pago:** la operación `manageData` escribe un par clave/valor en la propia cuenta de registro, sin mover fondos ni crear tokens. Así cada transacción queda en el historial público con su memo y sus datos, pero no hay transferencias de valor, trustlines ni emisión de activos que administrar.

### Flujo completo de un movimiento

```
Administrador            App (cliente)          Server Action             Stellar Testnet
     │                        │                       │                           │
     │ Suma/descuenta puntos  │                       │                           │
     │───────────────────────>│                       │                           │
     │                        │ Guarda en Neon        │                           │
     │                        │ (estado: pendiente)   │                           │
     │                        │──────────────────────>│                           │
     │                        │                       │ loadAccount (Horizon)     │
     │                        │                       │──────────────────────────>│
     │                        │                       │ build + sign + submit     │
     │                        │                       │──────────────────────────>│
     │                        │                       │<──────── hash de la tx ───│
     │                        │                       │ UPDATE movimientos        │
     │                        │                       │ tx_hash, "confirmado"     │
     │                        │<──── resultado ───────│                           │
     │  "Ver en Stellar       │                       │                           │
     │   Explorer"            │                       │                           │
     │<───────────────────────│                       │                           │
```

1. El administrador suma, descuenta o revierte puntos (o se canjea un premio).
2. El movimiento se guarda de inmediato en la base de datos (Neon Postgres), así el saldo del embajador se actualiza al instante.
3. El cliente llama a la Server Action `registrarMovimientosStellar` (`app/actions/stellar.ts`), que se ejecuta **solo en el servidor**.
4. El servidor carga la cuenta desde **Horizon Testnet** (`https://horizon-testnet.stellar.org`) para obtener el número de secuencia actual.
5. Construye la transacción, la firma con la clave secreta y la envía.
6. Si Horizon responde `tx_bad_seq` o un timeout (por ejemplo, con dos movimientos simultáneos), **reintenta hasta 3 veces** con 1,5 segundos de espera.
7. Al confirmarse, guarda el `tx_hash` en el movimiento y marca su estado como `confirmado`.
8. Actualiza el balance de XLM de la cuenta de registro, que se muestra en Administración.
9. En el Registro aparece el enlace **"Ver en Stellar Explorer"**.

Las operaciones masivas se procesan en lotes de hasta **50 movimientos por llamada**, de forma secuencial para respetar el número de secuencia de la cuenta.

### Cómo verificar un movimiento

Cualquier persona puede auditar un movimiento sin iniciar sesión:

1. En **Registro**, haz clic en **"Ver en Stellar Explorer"**.
2. Se abre `https://stellar.expert/explorer/testnet/tx/<hash>`.
3. Ahí se ven la fecha y hora exactas, el memo (`+10 StellarPoints`), la operación `manageData` con el ID del movimiento y del embajador, y la cuenta que la firmó.

Transacción de ejemplo, enviada al probar la integración:
[`85417543…6cd6e`](https://stellar.expert/explorer/testnet/tx/85417543d99b70bf9cde293cdc4bed89df37e5065e6867147660d69e6f12cd6e)

Para ver **todo** el historial del programa, abre la cuenta de registro desde **Administración → Cuentas Stellar**.

### Estados en la app

| Estado | Significado |
| --- | --- |
| **Confirmado** | La transacción está en Stellar Testnet; se muestra el enlace al explorador. |
| **Registrando…** (pendiente) | El movimiento ya está guardado en la base de datos y la transacción se está enviando a Stellar. |
| **Error** | El registro en Stellar falló (por ejemplo, porque Horizon no estaba disponible). El saldo del embajador **no se ve afectado** y el chip incluye un botón para **reintentar**. |
| **Histórico** | Movimientos importados antes de activar la integración. Son válidos, pero no tienen transacción en la blockchain. |

La base de datos es la **fuente de verdad del saldo**; Stellar es la **prueba pública** de cada movimiento.

### Costos

- Comisión por transacción: **0,00001 XLM**.
- Friendbot entrega **10.000 XLM** de testnet, suficientes para unos **mil millones** de registros.
- En Testnet el XLM no tiene valor real: **el costo es cero**.

### Seguridad

- La clave secreta **nunca llega al navegador**. Toda la firma ocurre en Server Actions (`"use server"`).
- Se prioriza la variable de entorno `STELLAR_SECRET_KEY`; la tabla `config_stellar` es solo un respaldo para el piloto.
- Las entradas de la Server Action se validan (tipos, enteros, máximo 50 por llamada) y los textos se recortan a los límites de bytes de Stellar (memo de 28 y `manageData` de 64).
- No se guardan datos personales en la blockchain: solo IDs internos y cantidades de puntos.

### Limitaciones de Testnet

- **Stellar reinicia Testnet periódicamente** (aproximadamente cada 3 meses). Cuando ocurre, se borran la cuenta de registro y todas sus transacciones, y los enlaces antiguos dejan de funcionar.
- Después de un reinicio hay que borrar la fila `registro` de `config_stellar`, o cambiar `STELLAR_SECRET_KEY`, para que la app cree y fondee una cuenta nueva automáticamente.
- Testnet está pensada para pruebas y no ofrece garantías de disponibilidad.

### Pasar a Mainnet

Para un registro permanente en la red principal:

1. Crear una cuenta en Mainnet y fondearla con XLM real (unos pocos XLM alcanzan para miles de registros).
2. Definir `STELLAR_SECRET_KEY` como variable de entorno en Vercel con la clave de Mainnet.
3. En `app/actions/stellar.ts`, cambiar `Networks.TESTNET` por `Networks.PUBLIC` y Horizon por `https://horizon.stellar.org`, y quitar el fondeo con Friendbot.
4. En `lib/stellar.ts`, cambiar `EXPLORER_BASE` a `https://stellar.expert/explorer/public` y `STELLAR_RED` a `"Stellar Mainnet"`.

---

## Stack técnico

- **Next.js 16** (App Router, Server Actions) y **React 19**
- **Tailwind CSS** y componentes **shadcn/ui**
- **Neon Postgres** con **Drizzle ORM**
- **@stellar/stellar-sdk** v17 (Horizon, TransactionBuilder, Keypair)
- **Recharts** para los gráficos y **SheetJS (xlsx)** para importar y exportar Excel
- Desplegado en **Vercel**

## Estructura del proyecto

```
app/
  (app)/                  Páginas: dashboard, embajadores, niveles, reglas, premios, registro, administración
  actions/
    datos.ts              Server Actions de lectura y escritura en Neon
    stellar.ts            Firma y envío de transacciones a Stellar Testnet
components/               Vistas por sección y componentes compartidos (StellarChip, etc.)
lib/
  db/schema.ts            Esquema Drizzle (movimientos con tx_hash y estado_blockchain, cuentas_stellar, config_stellar…)
  stellar.ts              Constantes y utilidades de Stellar (URLs del explorador, nombre del token)
  store.tsx               Estado de la app y orquestación del registro en Stellar
scripts/
  importar-excel.mjs      Importación inicial de embajadores desde Excel
```

## Puesta en marcha local

```bash
pnpm install
pnpm dev
```

La app queda disponible en `http://localhost:3000`.

## Variables de entorno

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Cadena de conexión de Neon Postgres. |
| `STELLAR_SECRET_KEY` | No (recomendada) | Clave secreta (`S…`) de la cuenta de registro. Si no se define, la app crea y fondea una cuenta de testnet automáticamente y la guarda en `config_stellar`. |
