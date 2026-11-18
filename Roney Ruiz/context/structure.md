# Plazo — Structure

> Tipo de aplicación, arquitectura, librerías y flujo de funciones.
> Los nombres de archivos y funciones son una propuesta para validar, no un contrato.
> Ver `approach.md` (la idea) y `expertise.md` (los tecnicismos).

## 1. Tipo de aplicación

**SPA solo frontend, sin backend propio.** La fuente de verdad es la red Stellar (testnet).

- Sin base de datos ni servidor: menos piezas, y refuerza la idea de que nadie custodia nada.
- `localStorage` solo para comodidad (IDs de depósitos vistos, idioma). Nunca guarda nada crítico.
- Despliegue opcional (el entregable es el código en el PR).

## 2. Stack y librerías

| Pieza | Elección | Motivo |
|---|---|---|
| Build / dev | **Vite** | arranque rápido |
| UI | **React + TypeScript** | los tipos ayudan con predicados y dinero |
| SDK de Stellar | **`@stellar/stellar-sdk`** | transacciones, claimants, Horizon y RPC |
| Wallet | **`@stellar/varial-sdk`** | SDK de Varial; una sola wallet, sin kit multi-wallet |
| Tests | **Vitest** (solo dominio) | lógica pura, sin red ni wallet |
| Estilos | CSS plano | no gastar tiempo en librerías de UI |

Requiere Node 20+. Confirmar nombres de paquete e imports del SDK con Raven (ver `expertise.md`, sección 12).

## 3. Configuración de red (un solo lugar)

`src/config/network.ts`:

```ts
export const NETWORK = {
  name: "testnet",
  passphrase: "Test SDF Network ; September 2015",   // o Networks.TESTNET
  horizonUrl: "https://horizon-testnet.stellar.org",
  rpcUrl: "https://soroban-testnet.stellar.org",
  friendbotUrl: "https://friendbot.stellar.org",
} as const;

export const DEMO_MODE_DEFAULT = true;   // E y D en minutos
```

## 4. Arquitectura en capas

```
   ui (React)  ──▶  hooks  ──▶  stellar/ , wallet/  ──▶  domain/
   pantallas        estado       adaptadores a la red     lógica pura
```

**Regla:** `domain/` no importa React, ni la wallet, ni red. Todo lo que tenga reglas de negocio vive ahí y se prueba con Vitest. Los adaptadores (`stellar/`, `wallet/`) traducen entre el dominio y el mundo exterior.

### Árbol de carpetas

```
<Nombre-Completo>/                  # carpeta en la raíz del fork
├─ package.json
├─ vite.config.ts
├─ index.html
├─ README.md
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ config/
   │  └─ network.ts
   ├─ domain/                       # puro, con tests
   │  ├─ types.ts                   # Deposit, DepositPlan, Role, Status
   │  ├─ money.ts                   # stroops, BigInt, tope de reparaciones
   │  ├─ plan.ts                    # validar input → DepositPlan
   │  ├─ predicates.ts              # modelo propio de predicados
   │  ├─ evaluate.ts                # evalPred, nextChangeAt
   │  └─ status.ts                  # estado y acción disponible por rol
   ├─ stellar/                      # adaptadores a la red
   │  ├─ servers.ts                 # Horizon.Server (y RPC)
   │  ├─ buildCreateDeposit.ts      # DepositPlan → XDR
   │  ├─ buildClaim.ts              # balanceId → XDR
   │  ├─ submit.ts                  # enviar XDR firmado, extraer IDs
   │  ├─ listDeposits.ts            # consulta por claimant → Deposit[]
   │  └─ errors.ts                  # códigos → mensajes legibles
   ├─ wallet/
   │  └─ varial.ts                  # conectar, firmar
   └─ ui/
      ├─ ConnectWallet.tsx          # pantalla 1 (requisito de la tarea)
      ├─ CreateDeposit.tsx          # pantalla 2
      ├─ MyDeposits.tsx             # pantalla 3
      ├─ DepositCard.tsx            # rol, estado, acción
      └─ hooks/                     # useWallet, useDeposits, useNow
```

## 5. Modelo de datos (domain/types.ts)

```ts
type Role = "inquilino" | "arrendador";

type DepositPlan = {
  tenant: string;            // G...
  landlord: string;          // G...
  totalStroops: bigint;
  endOfContract: number;     // E, segundos Unix
  deadline: number;          // D, segundos Unix
  repairCapBps?: number;     // reto: 3000 = 30%
};

type Status =
  | "esperando"              // t < E: nadie puede reclamar
  | "ventana_arrendador"     // E ≤ t < D
  | "reclamable_inquilino"   // t ≥ D
  | "reclamado";

type Deposit = {
  id: string;                // balance ID
  amountStroops: bigint;
  myRole: Role;
  status: Status;
  canClaimNow: boolean;
  nextChangeAt?: number;     // para la cuenta regresiva
};
```

## 6. Funciones clave

| Capa | Función | Hace |
|---|---|---|
| wallet | `connectWallet()` | pide acceso a Varial y devuelve la dirección |
| wallet | `signXdr(xdr, address)` | pide a la wallet firmar (testnet) |
| domain | `planDeposit(input)` | valida y devuelve `DepositPlan` o errores |
| domain | `splitWithCap(total, bps)` | calcula reparaciones y resto con BigInt |
| domain | `landlordPredicate(E, D)` / `tenantPredicate(D)` | construye los predicados |
| domain | `evalPred(pred, nowSec)` | ¿se cumple el predicado ahora? |
| domain | `deriveStatus(deposit, nowSec)` | estado y acción por rol |
| stellar | `buildCreateDeposit(plan)` | arma la transacción (1 o 2 operaciones) y devuelve XDR |
| stellar | `buildClaim(balanceId, claimant)` | arma el reclamo y devuelve XDR |
| stellar | `submit(signedXdr)` | envía y devuelve resultado e IDs de balance |
| stellar | `listDepositsFor(address)` | consulta por claimant y mapea a `Deposit[]` |
| stellar | `getDepositById(id)` | lectura por ID (vía RPC; plan B de Horizon) |
| stellar | `friendlyError(err)` | traduce códigos a mensajes |

## 7. Flujos

### 7.1 Crear depósito

```
Formulario ──▶ planDeposit()  ──▶ (errores) / DepositPlan
              │
              ▼
        buildCreateDeposit(plan)   cargar cuenta, 1–2 createClaimableBalance,
              │                    timeout de la tx, toXDR()
              ▼
        signXdr(xdr)               la wallet abre y el usuario firma
              │
              ▼
        submit(signedXdr)          enviar; extraer balanceId(s)
              │
              ▼
        Mostrar resultado + link ?deposit=<id> + guardar id en localStorage
```

Validaciones previas: direcciones válidas, arrendador ≠ inquilino, `E < D`, `E` en el futuro, monto > 0, saldo suficiente (monto + reservas + comisión), **el inquilino incluido como claimant**.

### 7.2 Ver mis depósitos

```
useDeposits(address) ──▶ listDepositsFor(address)   (Horizon, por claimant)
                     └─▶ getDepositById(id) para cada id guardado/compartido  (RPC)
        │
        ▼
  deriveStatus(deposit, now)  ──▶  DepositCard (rol, estado, botón o cuenta regresiva)
```

`useNow()` refresca el reloj cada segundo para actualizar estado y cuenta regresiva sin consultar la red.

### 7.3 Reclamar

```
Botón "Reclamar" (solo si canClaimNow) ──▶ buildClaim(id, address)
        ──▶ signXdr ──▶ submit ──▶ refrescar lista
        error CANNOT_CLAIM / DOES_NOT_EXIST ──▶ friendlyError()
```

## 8. Pantallas

1. **Conectar wallet:** botón de conectar Varial, muestra dirección y saldo de XLM en testnet. Indicador claro de red.
2. **Crear depósito:** arrendador (G...), monto, `E`, `D` (modo demo en minutos). **Vista previa en lenguaje natural:** "Si [arrendador] no reclama entre E y D, podrás recuperar X XLM después de D." Reto: control del tope de reparaciones.
3. **Mis depósitos:** tarjetas con rol, monto, estado, cuenta regresiva y botón de reclamar.
4. **Detalle por link (`?deposit=<id>`):** lectura de un balance concreto; permite al arrendador encontrarlo.

## 9. Plan de commits (mínimo 5, propios)

| # | Mensaje sugerido | Contenido |
|---|---|---|
| 1 | `chore: scaffold Vite + React + TS en carpeta del participante` | proyecto base, `network.ts` |
| 2 | `feat(wallet): conectar Varial vía su SDK en testnet` | **cumple el requisito mínimo:** dirección + saldo |
| 3 | `feat(domain): predicados de plazo y evaluador con tests` | `predicates`, `evaluate`, `money`, tests |
| 4 | `feat(deposit): crear depósito y firmar con la wallet` | `plan`, `buildCreateDeposit`, `submit`, pantalla 2 |
| 5 | `feat(deposit): listar y reclamar depósitos` | `listDeposits`, `buildClaim`, pantalla 3 |
| 6 | `docs: README con análisis de límites y uso de Raven` | cierre del PR |
| 7+ | `feat: tope de reparaciones (reto)` | si da tiempo |

## 10. Plan de tiempo (estimación aproximada)

- **Esta noche (~2 h):** commits 1 y 2, y empezar el 3. El PR puede abrirse al terminar el commit 2 (o como draft).
- **Mañana temprano:** commits 3 a 6, con prueba end-to-end en modo demo.
- **Antes de las 19:00:** PR final revisado y link pegado en la plataforma. No dejarlo para el último momento.

## 11. Riesgos y decisiones abiertas

1. **Horizon puede dejar de responder.** Mitigar: verificarlo en el commit 2 con una llamada simple; implementar `getDepositById` por RPC y el link `?deposit=<id>` como camino alterno. Decisión pendiente: ¿el link pasa a ser el mecanismo principal?
2. **Dos cuentas para probar.** Opciones: segunda cuenta en Varial (si permite varias) o segundo perfil de navegador. Fondear ambas con Friendbot.
3. **Tiempo en los bordes.** No prometer precisión al segundo; probar con ventanas de minutos.
4. **Imports y nombres del SDK de Varial.** Confirmar con Raven antes de codificar, no después.
5. **Alcance.** Si el tiempo aprieta, el tope de reparaciones y el link compartible se sacrifican primero.

## 12. Checklist del README / PR

- [ ] Nombre completo al inicio (y en la descripción del PR).
- [ ] Qué es Plazo y qué problema ataca (versión corta de `approach.md`).
- [ ] Funcionalidades y **límites honestos**.
- [ ] Tecnologías usadas.
- [ ] Cómo ejecutarlo (`cd <Nombre-Completo>`, `npm install`, `npm run dev`) y cómo probar con dos cuentas en modo demo.
- [ ] **Cómo usé Stellar Raven:** qué consulté, qué verifiqué (nombres del SDK, estado de Horizon, imports del SDK de Varial) y qué corrigió.
- [ ] Aclaración: testnet, práctica, sin validez legal.