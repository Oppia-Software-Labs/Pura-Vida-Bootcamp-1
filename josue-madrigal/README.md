# Drawly 🎟️ — Protocolo de Rifas Verificables en Stellar Testnet

**Drawly** es una plataforma descentralizada de rifas y sorteos auditables construida sobre **Stellar Testnet**, diseñada para erradicar el fraude y la desconfianza en sorteos tradicionales mediante criptografía y custodia transparente en el ledger de Stellar.

---

## 🎯 ¿Qué es Drawly?

En los sorteos tradicionales fuera de blockchain, los participantes sufren de incertidumbre constante: *¿quién garantiza que la tómbola no está arreglada? ¿los boletos vendidos son reales? ¿el ganador no es allegado del organizador?*

**Drawly** soluciona esto reemplazando los intermediarios por **matemática y el ledger público de Stellar**:
* **Fondos bajo custodia transparente:** Cada pago de boleto entra a una cuenta Bóveda auditada en Testnet.
* **Identidad inmutable en el ledger:** Cada entrada registra el alias del participante en el campo nativo `Memo.text` de la transacción.
* **Aleatoriedad determinista y auditable:** La selección del ganador se realiza tomando la entropía pública del último ledger cerrado de Stellar, permitiendo que cualquier persona en el mundo verifique matemáticamente el resultado.
* **Control de Ejecución de Sorteo:** Para evitar ejecuciones no autorizadas y permitir demostraciones controladas ante jurados o evaluadores, el motor de sorteo requiere el código de autorización **`stellar`** para ejecutar el snapshot del ledger.

---

## 📐 Verificabilidad Matemática On-Chain: ¿Cómo funciona?

El motor de sorteo de Drawly opera bajo 4 pasos auditables:

```
[Participante] ───► Envía 1 XLM a la Bóveda con Memo.text ("alias")
                           │
                           ▼
             [Horizon Testnet Indexer]
  (server.transactions().forAccount(VAULT_ADDRESS))
  Filtra txs exitosas con Memo.text válido ───► Total Participantes: N
                           │
                           ▼
             [Snapshot del Ledger de Cierre]
  (server.ledgers().order('desc').limit(1).call())
  Toma el hash SHA-256 inmutable del ledger (ej: ...7590ca732864a4743de2)
                           │
                           ▼
             [Fórmula Determinista On-Chain]
  1. Semilla Hexadecimal = Hash_Ledger.slice(-8)  --> "a4743de2"
  2. Semilla Decimal     = parseInt("a4743de2", 16) --> 2,759,081,442
  3. Índice Ganador      = 2,759,081,442 % N
                           │
                           ▼
          [Boleto Ganador Inmutable y Verificable]
```

### 🔍 Auditoría Independiente Paso a Paso:
Cualquier evaluador o participante puede verificar el sorteo sin confiar en la interfaz:
1. Abre el enlace del ledger de cierre en [Stellar Expert Testnet](https://stellar.expert/explorer/testnet).
2. Copia el hash SHA-256 del ledger.
3. Toma los últimos 8 caracteres y conviértelos de hexadecimal a decimal en cualquier consola (`parseInt("hash".slice(-8), 16)`).
4. Aplica la operación módulo entre la cantidad de boletos registrados. El resultado coincide con el índice del ganador mostrado por la app.

---

## 🏛️ Las 2 Líneas de Negocio

La interfaz cuenta con un selector minimalista estilo **Apple iOS Web3** que divide la plataforma en dos metodologías:

### 1. `Dynamic Pools (Pari-Mutuel)`
* **Mecánica:** Pozos continuos para micropagos comunitarios. El pozo arranca en **0 XLM** y crece con cada boleto vendido (**riesgo financiero = 0 para Drawly**).
* **Monetización:** **90%** para el ganador y **10%** como tarifa de protocolo (*Protocol Rake*) para la tesorería de Drawly.
* **Estado:** **100% Funcional On-Chain** en Stellar Testnet.

### 2. `Asset Launchpad (Raffle-as-a-Service - RaaS)`
* **Mecánica:** Diseñado para empresas, desarrolladores y comunidades que rifan hardware o activos de alto valor (ej: **Workstation MacBook Pro M3 Max**).
* **Garantía Smart Escrow & Soft-Cap:** Requiere una meta mínima de boletos (ej: 2,500 boletos). Si se alcanza, el contrato adjudica el activo; si **no** se alcanza al vencer el plazo, **reembolsa automáticamente el 100% a cada comprador**.
* **Monetización:** Tarifa plana de despliegue de bóveda (50 XLM / $50 USD) + **3.5%** sobre el total recaudado.

---

## 📦 Dependencias y Versiones Utilizadas

| Paquete | Versión | Propósito |
| :--- | :---: | :--- |
| **`@stellar/stellar-sdk`** | `^17.4.0` | Cliente oficial de Stellar (Horizon, TransactionBuilder, Memos, Keypairs) |
| **`@creit.tech/stellar-wallets-kit`** | `^2.8.0` | Conexión multi-wallet (Freighter/Varial, xBull, Albedo, LOBSTR) |
| **`react` & `react-dom`** | `^19.3.1` | Biblioteca de UI reactiva |
| **`vite`** | `^8.3.8` | Empaquetador y entorno de desarrollo ultra-rápido |
| **`tailwindcss` & `@tailwindcss/vite`** | `^4.3.5` | Motor de estilos utilitarios y diseño minimalista |
| **`vite-plugin-node-polyfills`** | `^0.23.0` | Polyfills de `Buffer` y criptografía para navegador |
| **`lucide-react`** | `^1.75.0` | Iconografía minimalista |

---

## 🛠️ Instalación y Ejecución Local

### Prerrequisitos:
* Node.js v20+ o v22+
* Extensión de navegador: **Freighter (Varial)** o **xBull** configurada en red **Testnet** (o usar **Albedo** directamente en web sin extensiones).

### Pasos:

1. **Entrar a la carpeta del proyecto:**
   ```bash
   cd Drawly
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

5. **Vista previa local del build de producción:**
   ```bash
   npm run preview
   ```

---

## 🌐 Despliegue en Vercel

El proyecto incluye el archivo [`vercel.json`](file:///Volumes/JosueSSD/puravida-bootcamp/Pura-Vida-Bootcamp-1/josue-madrigal/Drawly/vercel.json) preconfigurado para aplicaciones SPA:

```bash
cd Drawly
npx vercel
```
*(O vinculando el repositorio en el panel de Vercel y seleccionando `Drawly` como Root Directory).*

---

## 🔐 Seguridad y Buenas Prácticas
* **Sin claves privadas en el código:** Toda firma se solicita a la wallet del usuario vía Stellar Wallets Kit.
* **Validación estricta de 28 bytes:** El alias se evalúa en UTF-8 para garantizar cumplimiento con el protocolo Stellar antes de construir el XDR.
* **Bóvedas independientes:** Cada modalidad tiene su propia cuenta de custodia separada en Testnet.
