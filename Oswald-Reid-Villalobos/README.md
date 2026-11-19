# Factura Pura Vida

**Autor:** Oswald Reid Villalobos · Pura Vida Bootcamp · Entregable 1

Factoring de facturas electrónicas sobre Stellar.

## El problema

En Costa Rica la factura electrónica es obligatoria, así que cada factura ya es un dato digital verificable en Hacienda. Aun así, las PYMEs esperan entre 30 y 90 días para cobrarle a empresas grandes o al Estado. El flujo de caja es su dolor número uno.

## La idea

1. La PYME registra su factura electrónica (clave numérica de 50 dígitos) y se verifica con Hacienda.
2. La factura se **tokeniza en Soroban**.
3. Un inversionista la **financia en USDC**: paga hoy un adelanto con descuento.
4. La PYME **recibe hoy el dinero en colones vía SINPE**.
5. Al vencer, la empresa grande paga la factura completa y el inversionista recibe el monto total. La diferencia es su ganancia.

## Qué hay en esta carpeta

| Carpeta | Qué es |
|---|---|
| `app/` | Demo web: conexión de wallet Freighter (real, Testnet), registro de facturas, mercado de financiamiento y bitácora de movimientos |
| `contrato/` | Contrato Soroban en Rust: `registrar`, `financiar` (USDC del inversionista a la PYME), `pagar` (USDC del pagador al inversionista) y `consultar`, con pruebas |

En la demo web la wallet y los saldos de Testnet son reales; Hacienda, SINPE y las llamadas al contrato están simuladas en el navegador para que la idea se entienda en un minuto.

## Correr la demo

Freighter no funciona abriendo el archivo directamente, hace falta un servidor local:

```bash
cd app
npx serve .
```

Abrí la dirección que muestra, conectá Freighter en **Testnet** y tocá **Usar factura de ejemplo**.

## Probar el contrato

```bash
cd contrato
cargo test
```

## Stack

HTML, CSS y JavaScript sin build · `@stellar/freighter-api` · Horizon Testnet · Soroban SDK 23 (Rust).
