# Plazo — Approach

> **Nombre de trabajo (provisional).** Práctica de aprendizaje y entrega de la Tarea 1 del Pura Vida Bootcamp (Stellar).
> **No es un producto real:** opera solo en testnet, con dinero de prueba, y no sustituye ningún contrato.
> **Estado:** borrador v0. Las decisiones abiertas están en la sección 9.

## 1. En una frase

Un depósito de garantía que **nadie custodia**: queda bloqueado en la red Stellar con reglas de tiempo, y si el arrendador no actúa a tiempo, el dinero queda disponible para el inquilino. **El plazo es el juez.**

## 2. El problema

En un depósito de garantía (alquiler de casa, carro, equipo) el estado por defecto favorece a quien tiene el dinero:

- **Asimetría de poder.** El arrendador custodia el dinero; el inquilino depende de que lo devuelva y de cuándo.
- **El silencio no significa nada.** No existe una fecha a partir de la cual la devolución sea automática. Si nadie hace nada, el dinero sigue en manos de quien lo retiene.
- **No hay árbitro barato.** Un tercero (abogado, plataforma) lo resuelve, pero cobra y exige confiar en él.

## 3. La idea: invertir el default

El depósito no lo tiene ninguna de las dos partes. Se bloquea en la red Stellar dentro de un *claimable balance* con reglas de tiempo. Quién puede retirarlo en cada momento lo decide la red, no una persona.

### Actores

- **Inquilino** (depositante): crea el depósito y aporta el dinero.
- **Arrendador** (reclamante condicional): solo puede reclamar dentro de una ventana de tiempo.

### Variables

- `E` = fin del contrato (inicio de la ventana del arrendador).
- `D` = plazo límite de reclamo (fin de la ventana). Siempre `E < D`.
- `monto` = cantidad depositada (XLM de testnet en v1).

### Reglas

| Momento | Arrendador | Inquilino |
|---|---|---|
| `t < E` | no puede reclamar | no puede reclamar |
| `E ≤ t < D` | **puede reclamar** | no puede reclamar |
| `t ≥ D` | no puede reclamar | **puede reclamar** |

```
depósito ────── E (fin de contrato) ────── D (plazo) ──────▶
                [  ventana arrendador  ]  [  inquilino →
```

**Regla de oro:** si el arrendador no hace nada entre `E` y `D`, el inquilino puede recuperar el depósito después de `D`, sin pedir permiso a nadie.

### Matices importantes

- "Automático" significa **que no hace falta el permiso de nadie**, no que el dinero se transfiera solo. Después de `D` el inquilino debe firmar una transacción de reclamo (y pagar una comisión mínima).
- Antes de `E` nadie puede reclamar. Eso evita que el arrendador se lleve el depósito al día siguiente de firmar.
- En v1, si el arrendador reclama dentro de su ventana, se lleva el balance completo. Ver límites (sección 5).

## 4. Por qué blockchain

**Lo que sí aporta:**

- La regla es simple, binaria y basada en tiempo, así que la red la puede hacer cumplir.
- Ninguna de las partes custodia el dinero.
- Ambas partes verifican el mismo registro público.
- No hay intermediario al que pagar ni en quien confiar.

**Lo que no es:** un notario o un escrow bancario logran algo parecido. La ventaja aquí es costo y neutralidad, no una capacidad imposible de lograr de otra forma. Esta honestidad es parte del aprendizaje.

## 5. Límites honestos (material para el README)

1. **No hay árbitro.** La cadena no sabe si el daño existió; solo decide quién puede actuar y cuándo.
2. **El arrendador puede llevarse el 100% en su ventana.** Mitigación (reto): dividir el depósito en dos balances creados en una sola transacción: un *fondo de reparaciones* con tope porcentual (con las reglas de la sección 3) y el resto reclamable por el inquilino desde `E`.
3. **Volatilidad.** XLM cambia de precio; algo real usaría una stablecoin.
4. **Ambas partes necesitan wallet** y un poco de XLM para comisiones.
5. **Sin respaldo legal.** Es una práctica, no un contrato.
6. **El tiempo lo da la red.** Los predicados se evalúan con la hora de cierre del ledger, no con el reloj del usuario. Cerca de `E` o `D` puede haber diferencias de segundos.
7. **Un árbitro real requeriría multifirma** (2 de 3). Queda como v2 posible.

## 6. Alcance

### v1 (MVP)

- Conectar wallet (Varial, testnet) y mostrar dirección y saldo.
- Crear depósito (un balance, XLM nativo): arrendador, monto, `E`, `D`.
- Listar los depósitos de la cuenta conectada, con su rol y estado.
- Reclamar cuando el predicado lo permita.
- **Modo demo:** `E` y `D` en minutos para probar el flujo completo.
- Mensajes de error legibles.

### Reto (si da tiempo)

- Tope de reparaciones (dos balances en una transacción).
- Evaluador de predicados con cuenta regresiva.
- Link compartible `?deposit=<id>` para que el arrendador encuentre el depósito.
- Activo de prueba en lugar de XLM nativo (para aprender trustlines).

### Fuera de alcance

Backend propio, mainnet, arbitraje, notificaciones, stablecoins reales, identidad/KYC, validez legal.

## 7. Cómo cumple la Tarea 1

- Construida sobre Stellar, con Stellar Raven como asistente (documentar el uso en el README del PR).
- Sección para conectar la wallet: pantalla 1 de la app.
- Entrega:
  1. Fork de `Oppia-Software-Labs/Pura-Vida-Bootcamp-1`.
  2. Carpeta con el nombre completo en la raíz del fork.
  3. Rama `feature/<nombre>`.
  4. Al menos 5 commits propios.
  5. PR a `main` del repo original, con el nombre completo en la descripción.
  6. Pegar el link del PR en la plataforma.
- **Cierre:** miércoles 18 de noviembre, 19:00.

## 8. Criterio de éxito

1. Demo completa en testnet con dos cuentas (inquilino y arrendador).
2. Corrida A: `E` = +2 min, `D` = +5 min. Antes de `E` nadie puede reclamar; en la ventana el arrendador reclama.
3. Corrida B: nadie reclama; pasado `D`, el inquilino recupera el depósito.
4. Quien construyó la app puede explicar cada predicado y cada decisión de diseño sin mirar el código.

## 9. Decisiones abiertas

- [ ] **Nombre:** ¿Plazo, Vence, Fianza o Arras?
- [ ] **Tope de reparaciones:** ¿en v1 o como reto de la mañana?
- [ ] **Activo:** XLM nativo (más simple) vs token de prueba (enseña trustlines).
- [ ] **Idioma de la UI:** solo español o bilingüe.
- [ ] **Descubrimiento del depósito:** ¿listar con Horizon (puede dejar de existir) o hacer del link compartible el mecanismo principal? Ver `structure.md`, sección de riesgos.