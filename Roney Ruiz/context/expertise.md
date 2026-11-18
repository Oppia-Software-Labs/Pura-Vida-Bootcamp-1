# Plazo — Expertise (tecnicismos explicados)

> Todo lo que hay que entender para construir y defender Plazo.
> Los bloques de código son **bocetos**: los nombres exactos de métodos y paquetes deben confirmarse con Stellar Raven (ver sección 12).

## 1. Stellar en 5 minutos

- **Stellar** es una blockchain pública pensada para mover valor: pagos, activos (stablecoins, tokens) y, vía Soroban, contratos inteligentes. Plazo **no usa Soroban**: usa funciones nativas del protocolo.
- **Cuenta:** identificada por una llave pública (`G...`). Se controla con la llave secreta (`S...`), que **nunca** debe tocar la app ni el repositorio.
- **XLM (lumens):** la moneda nativa. Se usa para comisiones y reservas. La unidad mínima es el **stroop**: `1 XLM = 10 000 000 stroops` (7 decimales).
- **Testnet vs mainnet:** testnet es una copia de práctica con dinero sin valor. **Friendbot** fondea cuentas de testnet gratis. Todo el proyecto vive en testnet.
- **Network passphrase:** texto que identifica la red y se incluye en la firma. Una transacción firmada para testnet no es válida en mainnet. Se obtiene de `Networks.TESTNET` del SDK.
- **Comisión base:** 100 stroops por operación (0.00001 XLM). Las operaciones de una transacción se cobran juntas.
- **Ledger:** cada "bloque" de la red. Se cierra aproximadamente cada 5 segundos. Su **hora de cierre** es la referencia de tiempo del protocolo.

## 2. Cuentas, reserva y sponsorship

- Una cuenta debe mantener un **saldo mínimo** (reserva base × (2 + entradas que posee)). Cada "cosa" que la cuenta tiene en el ledger sube ese mínimo.
- Un claimable balance es una entrada del ledger. **Cada claimant sube en una reserva base** el mínimo de la cuenta que lo crea. La reserva se libera cuando el balance se reclama y la entrada se elimina.
- Consecuencia para Plazo: el inquilino necesita **monto + comisión + reservas** disponibles. Si falla con `LOW_RESERVE` o `UNDERFUNDED`, falta saldo. La reserva base actual (0.5 XLM) debe verificarse con Raven.

## 3. Transacciones y operaciones

- Una **transacción** agrupa 1 a 100 **operaciones**. Es **atómica**: o todas funcionan o ninguna. Esto es clave para el tope de reparaciones: los dos balances se crean juntos o no se crea ninguno.
- **Sequence number:** cada cuenta lleva un contador; cada transacción debe usar el siguiente. El SDK lo gestiona al cargar la cuenta.
- **XDR:** formato binario (en base64) con el que se serializan transacciones. La app genera el XDR; la wallet lo firma; la app lo envía.
- **Flujo de firma:** `construir → toXDR() → wallet.signTransaction(xdr) → enviar a la red`. **La wallet firma pero no envía**: eso lo hace la app.
- **Time bounds de la transacción:** ventana en la que la transacción es válida para entrar a un ledger. En el SDK de JS hay que fijarla (por ejemplo `setTimeout(180)`). **No confundir** con los predicados de tiempo del claimable balance: son dos cosas distintas.

## 4. Wallets

- Una wallet guarda llaves y firma por el usuario. **Varial** (antes Freighter) es la wallet oficial de la Stellar Foundation como extensión de navegador, y también tiene versión móvil.
- **Conectar wallet** = pedirle permiso para leer la dirección pública. No se comparte ninguna llave secreta.
- **`@stellar/varial-sdk`** es el SDK cliente de Varial: la app habla directo con la extensión, sin kit multi-wallet. Se usa una sola wallet.
- Para firmar, la app envía un XDR a Varial y recibe el XDR firmado. Confirmar los nombres exactos de las funciones del SDK antes de codificar.
- Si la wallet está en otra red que la app, la firma falla o es inválida. Verificar siempre que ambas estén en testnet.

## 5. Claimable balances (el corazón de Plazo)

Un claimable balance divide un pago en dos pasos:

1. **Crear** (`createClaimableBalance`): el emisor bloquea un monto de un activo y declara una lista de **claimants**, cada uno con un **predicado**.
2. **Reclamar** (`claimClaimableBalance`): un claimant firma una transacción para cobrarlo. Si su predicado es verdadero en ese momento, recibe el monto y el balance se elimina.

Reglas que importan:

- **Los predicados se evalúan al reclamar, no al crear.**
- **Gana el primero que reclama con éxito.** El balance es indivisible y se elimina al primer reclamo.
- **Máximo 10 claimants, y la misma cuenta no puede aparecer dos veces.** Por eso inquilino y arrendador deben ser cuentas distintas (y por eso para probar hacen falta dos cuentas).
- **El emisor no recupera nada por ser emisor.** Si no se incluye a sí mismo como claimant, no puede recuperar el dinero. En Plazo el inquilino **siempre** debe ser claimant (validar en la UI).
- **Activos no nativos:** requieren trustline (el emisor al crear, el claimant al reclamar). Con XLM nativo no hace falta.
- El ID del balance es un hash derivado de la operación que lo creó. Se usa para consultarlo y reclamarlo.

## 6. Predicados

Un predicado es una condición de tiempo que se combina con lógica:

| Predicado | Significado |
|---|---|
| `unconditional` | siempre verdadero |
| `before_absolute_time(T)` | verdadero si la hora de cierre del ledger es **menor** que `T` (segundos Unix) |
| `before_relative_time(s)` | verdadero hasta `s` segundos después del cierre del ledger que creó el balance |
| `and(a, b)` | ambos verdaderos |
| `or(a, b)` | alguno verdadero |
| `not(a)` | negación |

`and` y `or` toman exactamente dos sub-predicados (se anidan para más).

### Los predicados de Plazo

Con `E` = fin de contrato y `D` = plazo, ambos en segundos Unix. Plazo usa solo tiempo **absoluto** porque es más fácil de razonar y de mostrar en la UI.

```
Arrendador: AND( NOT(before(E)), before(D) )   → verdadero en  E ≤ t < D
Inquilino:  NOT( before(D) )                   → verdadero en  t ≥ D
```

Tabla de verdad (recordar que `before(X)` es `t < X`):

| Momento | `before(E)` | `before(D)` | Arrendador | Inquilino |
|---|---|---|---|---|
| `t < E` | V | V | F | F |
| `E ≤ t < D` | F | V | **V** | F |
| `t ≥ D` | F | F | F | **V** |

Bordes: en `t == E` ya puede reclamar el arrendador; en `t == D` ya no puede, y sí el inquilino. Validar siempre `E < D` (y `E` en el futuro).

Boceto (confirmar firmas exactas con Raven; el tiempo se pasa como string):

```ts
import { Claimant } from "@stellar/stellar-sdk";

const arrendador = new Claimant(
  ARRENDADOR_G,
  Claimant.predicateAnd(
    Claimant.predicateNot(Claimant.predicateBeforeAbsoluteTime(String(E))),
    Claimant.predicateBeforeAbsoluteTime(String(D)),
  ),
);

const inquilino = new Claimant(
  INQUILINO_G,
  Claimant.predicateNot(Claimant.predicateBeforeAbsoluteTime(String(D))),
);
```

## 7. El tiempo en Stellar

- El tiempo "oficial" para los predicados es la **hora de cierre del ledger** en que entra la transacción de reclamo, no el reloj del navegador.
- **Consecuencia práctica:** una transacción enviada a las 11:59:58 puede entrar en un ledger de las 12:00:03. Si `D` es 12:00:00, el arrendador **ya no** podrá reclamar. La UI debe advertir un margen de seguridad (por ejemplo 15 a 30 segundos) y no prometer precisión al segundo.
- Para el estado mostrado en pantalla (¿puedo reclamar ya?) basta con el reloj del cliente más un margen. Alternativa más rigurosa: usar la hora de cierre del último ledger que reporta la API.
- **Modo demo:** `E = ahora + 2 min`, `D = ahora + 5 min`. Es la forma de probar todo el flujo en minutos.

## 8. Dinero y precisión

- Los montos en Stellar son strings con hasta 7 decimales. **Nunca usar `number` de JS para calcular dinero**: `0.1 + 0.2 !== 0.3`.
- Convertir a stroops (`BigInt`), calcular, y volver a string con 7 decimales.
- Tope de reparaciones con `pctBps` (puntos base, `3000` = 30%):

```ts
const total = toStroops("100");               // 1_000_000_000n
const reparaciones = (total * BigInt(pctBps)) / 10_000n;
const resto = total - reparaciones;           // el resto absorbe el redondeo
```

- La suma de ambos balances debe ser **exactamente** el total (el resto se calcula por resta, no por porcentaje).

## 9. Consultar el estado: Horizon vs RPC (riesgo real)

- **Horizon** es la API REST histórica. `GET /claimable_balances?claimant=G...` lista los balances de una cuenta. El SDK la expone como `server.claimableBalances().claimant(G).call()`.
- **Estado de Horizon:** la documentación de Stellar indica que está cerca del fin de vida y será reemplazada por RPC. En la guía de migración, **`GET /claimable_balances` no tiene equivalente directo en RPC**.
- **Stellar RPC** sí permite leer **un balance concreto por ID** con `getLedgerEntries`.
- **Implicaciones de diseño:**
  1. Para v1 se puede listar con Horizon mientras responda en testnet (verificarlo en el primer commit).
  2. Para no depender de ello, el flujo debe permitir **descubrir un depósito por su ID** (link compartible) y leerlo con RPC.
  3. El ID del balance se obtiene del resultado de la transacción de creación (verificar con Raven cómo extraerlo).
- **Forma del predicado en la respuesta de Horizon** (verificar inspeccionando una respuesta real): objeto con claves `and` / `or` / `not` / `abs_before` (más `abs_before_epoch`) / `rel_before`, o `unconditional`.

### Evaluador de predicados (reto de aprendizaje)

El SDK no trae un método para resolver "¿puedo reclamar ahora?". Hay que escribir una función recursiva sobre la forma JSON:

```ts
type Pred =
  | { unconditional: true }
  | { and: [Pred, Pred] }
  | { or: [Pred, Pred] }
  | { not: Pred }
  | { abs_before_epoch: string };   // rel_before: no usado en Plazo

function evalPred(p: Pred, nowSec: number): boolean {
  if ("unconditional" in p) return true;
  if ("and" in p) return evalPred(p.and[0], nowSec) && evalPred(p.and[1], nowSec);
  if ("or" in p)  return evalPred(p.or[0], nowSec)  || evalPred(p.or[1], nowSec);
  if ("not" in p) return !evalPred(p.not, nowSec);
  return nowSec < Number(p.abs_before_epoch);
}
```

Es una función pura: se prueba con tests unitarios sin red ni wallet.

## 10. Errores comunes y cómo mostrarlos

| Situación | Causa probable | Mensaje sugerido |
|---|---|---|
| `LOW_RESERVE` / `UNDERFUNDED` al crear | falta saldo para monto + reservas + comisión | "Te falta XLM para cubrir el depósito y la reserva." |
| `MALFORMED` al crear | claimants repetidos, monto ≤ 0, predicado inválido | "Los datos del depósito no son válidos." |
| `NO_TRUST` | activo no nativo sin trustline | "Falta habilitar el activo en tu cuenta." |
| `CANNOT_CLAIM` al reclamar | el predicado es falso ahora | "Todavía no (o ya no) puedes reclamar este depósito." |
| `DOES_NOT_EXIST` al reclamar | ya fue reclamado | "Este depósito ya fue reclamado." |
| `tx_bad_seq` | secuencia desactualizada | "Intenta de nuevo." |
| Firma rechazada | el usuario canceló, o red equivocada en la wallet | "La wallet no firmó. Verifica que esté en testnet." |

Los códigos exactos deben confirmarse con Raven y con respuestas reales de testnet.

## 11. Seguridad mínima

- **Nunca** pedir, guardar ni registrar una llave secreta o frase semilla.
- Usar una **cuenta de desarrollo** distinta de cualquier cuenta con fondos reales.
- Validar direcciones con `StrKey.isValidEd25519PublicKey`.
- Mostrar al usuario **qué va a firmar** (monto, reglas, fechas) antes de abrir la wallet.
- Fijar la red a testnet en un solo lugar de configuración.

## 12. Verificar con Raven antes de dar algo por cierto

- [ ] Nombres exactos en el SDK de JS: `Claimant.*`, `Operation.createClaimableBalance`, `Operation.claimClaimableBalance`.
- [ ] Que `GET /claimable_balances?claimant=` responda hoy en Horizon testnet.
- [ ] Forma real del predicado en el JSON de Horizon.
- [ ] Cómo obtener el `balanceId` del resultado de la transacción de creación.
- [ ] Nombre del paquete del SDK (`@stellar/varial-sdk` en npm) y sus imports.
- [ ] Reserva base actual y valor de Friendbot.
- [ ] Códigos de error exactos de crear y reclamar.

## 13. Glosario

- **Claimant:** cuenta autorizada a reclamar un balance bajo cierto predicado.
- **Predicado:** condición (de tiempo) que debe cumplirse para reclamar.
- **Operación / transacción:** acción individual / paquete atómico de acciones.
- **XDR:** formato binario de las transacciones.
- **Horizon / RPC:** APIs para consultar y enviar a la red.
- **Friendbot:** servicio que fondea cuentas de testnet.
- **Stroop:** la unidad mínima de XLM (1/10 000 000).
- **Reserva base:** saldo que una cuenta debe mantener por cada entrada que posee.
- **Trustline:** autorización de una cuenta para tener un activo no nativo.
- **Ledger:** cada bloque de la red; su hora de cierre es el reloj del protocolo.
- **SEP-43:** estándar de interfaz de wallets web.

## 14. Fuentes

- Claimable balances: https://developers.stellar.org/docs/build/guides/transactions/claimable-balances
- CAP-23 (propuesta original): https://github.com/stellar/stellar-protocol/blob/master/core/cap-0023.md
- CLI, ejemplos de predicados: https://developers.stellar.org/docs/tools/cli/cookbook/tx-new-create-claimable-balance
- Migración de Horizon a RPC: https://developers.stellar.org/docs/data/apis/migrate-from-horizon-to-rpc.md
- Varial SDK: https://www.npmjs.com/package/@stellar/varial-sdk
- Wallets en el ecosistema: https://developers.stellar.org/docs/tools/developer-tools/wallets
- Stellar Raven: https://raven.stellar.org/docs