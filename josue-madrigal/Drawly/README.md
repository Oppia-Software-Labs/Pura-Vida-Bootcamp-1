# Drawly 🎟️ — Verifiable Web3 Raffles on Stellar Testnet

**Drawly** es un protocolo descentralizado de rifas y sorteos auditables sobre **Stellar Testnet**, diseñado para erradicar el fraude y la desconfianza en sorteos tradicionales mediante criptografía y custodia en contratos inteligentes.

---

## 🏛️ Las 2 Metodologías de Negocio de Drawly

Para mantener una interfaz limpia estilo **Apple / iOS Web3**, la plataforma separa sus dos líneas de negocio en un selector minimalista:

### 1. 🟢 `Dynamic Pools (Pari-Mutuel)`
* **Público objetivo**: Comunidad Web3 y usuarios cotidianos que participan con micropagos.
* **Modelo Económico**: Pozo acumulativo orgánico. La app **no financia premios por adelantado** (riesgo financiero = 0).
* **Distribución del Pozo**:
  * **90%** para el boleto ganador.
  * **10%** como tarifa de protocolo (*Protocol Rake*) para la tesorería de Drawly.
* **Interacción On-Chain**: Compra directa de boletos de 1 XLM hacia la **Bóveda del Sorteo** (`GBCD...YVFI`) guardando el alias del usuario en el campo `Memo.text` inmutable del ledger.

### 2. 🏢 `Asset Launchpad (Raffle-as-a-Service - RaaS)`
* **Público objetivo**: Concesionarios de autos, empresas, influencers y ONGs que sortean bienes físicos de alto valor (como vehículos, motos o causas benéficas).
* **El Problema que Resuelve**: Elimina las dudas de si una rifa de auto está "arreglada" para amigos del organizador.
* **Mecánica Smart Escrow & Soft-Cap**:
  * La organización define la meta mínima (*Soft Cap*, ej: 2,500 boletos para cubrir el auto).
  * Los fondos quedan en custodia en la bóveda de Stellar.
  * **Si se alcanza la meta**: El contrato inteligente selecciona al ganador de forma imparcial y libera los fondos para entregar el vehículo.
  * **Si NO se alcanza la meta**: El contrato **reembolsa automáticamente el 100% de los fondos** a cada comprador sin comisiones.
* **Monetización RaaS**:
  * Tarifa plana de despliegue de bóveda (ej: 50 XLM / $50 USD).
  * Comisión de éxito del **3.5%** sobre el capital total recaudado.

---

## 📦 Stack Tecnológico

* **Blockchain**: Stellar Network (Horizon Testnet + Soroban)
* **SDK**: `@stellar/stellar-sdk` v17.4.0
* **Wallet Kit**: `@creit.tech/stellar-wallets-kit` v2.8.0 (Freighter, xBull, Albedo, LOBSTR, WalletConnect)
* **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4
* **Diseño UI**: Minimalista Apple / iOS Web3 (OLED `#050505`, bordes finos `border-white/10`, popover flotante)

---

## 🚀 Instalación y Ejecución

```bash
cd Drawly

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```
