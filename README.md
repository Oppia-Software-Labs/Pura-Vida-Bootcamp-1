# 💧 ASADA Pagos — cobro transparente de la cuota del agua en Stellar

Contrato inteligente en **Soroban (Stellar)** para que una ASADA cobre la cuota mensual del agua y cualquier vecino pueda comprobar quién pagó y en qué se usó la plata.

> Tarea 1 — Primer contrato inteligente en Stellar (práctica individual).

---

## 1. El problema

**¿Quién lo vive?** Las familias de comunidades rurales de Costa Rica que reciben el agua de una **ASADA** (Asociación Administradora de Acueductos Comunales). Hay más de 1 000 ASADAS en el país.

**¿Qué pasa hoy?** La cuota mensual se paga en efectivo al tesorero o por SINPE, y se anota en un cuaderno o un Excel. Entonces:

- Un vecino paga, pero el pago **no queda anotado** y luego le dicen que está moroso.
- Nadie fuera de la junta puede ver **cuánta plata hay en la caja**.
- Cuando se gasta en una reparación, los vecinos **no saben a quién se le pagó ni cuánto**.

**¿Por qué importa?** Sin confianza la gente deja de pagar, y sin pagos la ASADA no puede reparar tuberías ni mantener el agua potable.

**La solución en una frase:** un registro público, que nadie puede borrar, donde cada vecino paga su mes, recibe un comprobante, y cada colón que sale de la caja queda a la vista.

### ¿Por qué elegí este problema?

- Es **real y cercano**: muchas comunidades lo viven y el mecanismo es sencillo (una cuota fija por mes).
- Es **pequeño**: cabe en un solo contrato con pocas funciones.
- Usa justo lo que da una blockchain: **registro inmutable, transparencia y pagos con firma**, sin intermediarios.

---

## 2. Cómo funciona

Hay dos roles:

| Rol | Quién es | Qué puede hacer |
|---|---|---|
| **Admin** | La junta directiva de la ASADA | Registrar abonados, dar de baja, cambiar la cuota, retirar fondos |
| **Abonado** | Cada casa con medidor | Pagar su cuota mensual |
| **Cualquiera** | Vecinos, municipalidad, AyA | Consultar si alguien está al día, ver recibos y el saldo |

Flujo:

```
Junta despliega el contrato (admin, token, cuota)
        │
        ▼
Junta registra abonado ──► (dirección + número de medidor)
        │
        ▼
Abonado paga periodo 202611 ──► el token pasa de su cuenta a la caja del contrato
        │                          se guarda un Recibo (monto, ledger, fecha)
        ▼
Cualquiera consulta esta_al_dia(abonado, 202611) ──► true
        │
        ▼
Junta retira fondos para el fontanero ──► queda un evento público "fondos_retirados"
```

### Funciones del contrato

| Función | Firma requerida | Descripción |
|---|---|---|
| `__constructor(admin, token, cuota)` | — | Se ejecuta al desplegar. Define la junta, el token de pago y la cuota. |
| `registrar_abonado(abonado, medidor)` | admin | Agrega una casa con su número de medidor. |
| `dar_de_baja(abonado)` | admin | Desactiva un abonado (su historial se conserva). |
| `cambiar_cuota(nueva_cuota)` | admin | Cambia la cuota para los pagos futuros. |
| `retirar_fondos(destino, monto)` | admin | Paga una reparación u otro gasto desde la caja. |
| `pagar_cuota(abonado, periodo)` | abonado | Paga el mes `AAAAMM` (ej. `202611`) y devuelve un `Recibo`. |
| `esta_al_dia(abonado, periodo)` | — | `true` si ese mes está pagado. |
| `recibo(abonado, periodo)` | — | Comprobante del pago, si existe. |
| `abonado(abonado)` | — | Medidor, si está activo y cuántos meses ha pagado. |
| `cuota()` / `saldo()` / `admin()` | — | Cuota vigente, plata en la caja y cuenta de la junta. |

### Reglas que protege el contrato

- No se puede pagar **dos veces el mismo mes** (`PeriodoYaPagado`).
- Solo pagan **abonados registrados y activos** (`AbonadoNoExiste`, `AbonadoInactivo`).
- El periodo debe ser un `AAAAMM` válido, mes 01–12 (`PeriodoInvalido`).
- La junta no puede retirar más de lo que hay ni montos en cero (`FondosInsuficientes`, `MontoInvalido`).
- Toda acción de la junta exige **la firma del admin** (`require_auth`).
- Se emiten eventos (`abonado_registrado`, `cuota_pagada`, `fondos_retirados`) para que cualquier explorador o app pueda seguir el historial.

El pago usa cualquier token de Stellar que cumpla la interfaz estándar (XLM nativo, USDC, o un token propio de la ASADA).

---

## 3. Estructura del proyecto

```
asada-pagos/
├── Cargo.toml                  # workspace
├── Cargo.lock
├── README.md
└── contracts/
    └── asada/
        ├── Cargo.toml
        └── src/
            ├── lib.rs          # el contrato
            └── test.rs         # pruebas
```

---

## 4. Cómo correrlo

### Requisitos

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32v1-none

# Stellar CLI
cargo install --locked stellar-cli
```

### Pruebas

```bash
git clone <URL-de-este-repo>
cd asada-pagos
cargo test
```

Resultado esperado:

```
running 12 tests
test test::abonado_dado_de_baja_no_paga ... ok
test test::cambio_de_cuota_aplica_a_pagos_nuevos ... ok
test test::no_registrado_no_puede_pagar ... ok
test test::junta_retira_fondos_para_reparacion ... ok
test test::no_se_registra_dos_veces ... ok
test test::no_se_puede_pagar_dos_veces_el_mismo_mes ... ok
test test::rechaza_periodo_invalido ... ok
test test::pago_mensual_exitoso ... ok
test test::registra_abonado ... ok
test test::retiro_requiere_firma_del_admin ... ok
test test::varios_meses_y_varios_vecinos ... ok
test test::sin_firma_del_admin_no_se_registra - should panic ... ok

test result: ok. 12 passed; 0 failed
```

### Compilar a WASM

```bash
stellar contract build
# genera target/wasm32v1-none/release/asada_pagos.wasm
```

### Desplegar y probar en Testnet

```bash
# 1. Cuentas de prueba con fondos (friendbot)
stellar keys generate junta  --network testnet --fund
stellar keys generate vecina --network testnet --fund

# 2. Dirección del contrato del XLM nativo en testnet (será el token de pago)
XLM=$(stellar contract id asset --asset native --network testnet)

# 3. Desplegar: cuota de 5 XLM (1 XLM = 10 000 000 stroops)
ASADA=$(stellar contract deploy \
  --wasm target/wasm32v1-none/release/asada_pagos.wasm \
  --source junta --network testnet \
  -- \
  --admin junta --token $XLM --cuota 50000000)
echo $ASADA

# 4. La junta registra a la vecina
stellar contract invoke --id $ASADA --source junta --network testnet \
  -- registrar_abonado --abonado vecina --medidor MED-001

# 5. La vecina paga noviembre 2026
stellar contract invoke --id $ASADA --source vecina --network testnet \
  -- pagar_cuota --abonado vecina --periodo 202611

# 6. Cualquiera verifica
stellar contract invoke --id $ASADA --source vecina --network testnet \
  -- esta_al_dia --abonado vecina --periodo 202611      # true
stellar contract invoke --id $ASADA --source vecina --network testnet \
  -- saldo                                              # "50000000"

# 7. Intentar pagar el mismo mes otra vez → falla con Error(Contract, #6)
stellar contract invoke --id $ASADA --source vecina --network testnet \
  -- pagar_cuota --abonado vecina --periodo 202611

# 8. La junta paga una reparación de 2 XLM
stellar contract invoke --id $ASADA --source junta --network testnet \
  -- retirar_fondos --destino junta --monto 20000000
```

El contrato y todas sus transacciones se pueden ver en [stellar.expert (testnet)](https://stellar.expert/explorer/testnet) buscando el ID `$ASADA`.

---

## 5. Pruebas incluidas

| Prueba | Qué verifica |
|---|---|
| `registra_abonado` | El abonado queda guardado con su medidor, activo y 0 meses pagados. |
| `pago_mensual_exitoso` | El pago mueve la cuota a la caja, genera recibo, marca el mes al día y exige la firma del vecino (incluida la del `transfer`). |
| `no_se_puede_pagar_dos_veces_el_mismo_mes` | Un segundo pago del mismo periodo falla y no se cobra doble. |
| `varios_meses_y_varios_vecinos` | Cada vecino lleva su propio historial; se detecta quién debe un mes. |
| `rechaza_periodo_invalido` | `202613`, `202600`, `11`, `999912` se rechazan. |
| `no_registrado_no_puede_pagar` | Una cuenta que no es abonada no puede pagar. |
| `no_se_registra_dos_veces` | No se puede registrar dos veces la misma cuenta. |
| `abonado_dado_de_baja_no_paga` | Un abonado inactivo no puede pagar. |
| `cambio_de_cuota_aplica_a_pagos_nuevos` | La nueva cuota se cobra desde el siguiente pago; cuota 0 se rechaza. |
| `junta_retira_fondos_para_reparacion` | El retiro llega al destino, baja el saldo y valida montos. |
| `retiro_requiere_firma_del_admin` | Quien autoriza el retiro es la cuenta de la junta. |
| `sin_firma_del_admin_no_se_registra` | Sin la firma del admin, registrar abonados falla. |

---

## 6. Ideas para mejorarlo (fuera del alcance)

- Cuota distinta según consumo leído del medidor.
- Multisig de la junta (presidente + tesorero) para retirar fondos.
- Recargo por pago tardío.
- Una pequeña página web donde el vecino escanee un QR y pague su mes.

---

Hecho con [Soroban SDK](https://developers.stellar.org/docs/build/smart-contracts/overview) · Stellar Testnet
