# ✦ StellarChamba LATAM
### Plataforma de Empleos, Gigs & Bounties Web3 para Desarrolladores de Latinoamérica con pagos en Stellar Lumens (XLM)

**Estudiante:** Josué Valenzuela  
**Entregable:** Entregable 1 · Pura Vida Bootcamp (Stellar & Soroban)  
**Rama:** `feature/josue-valenzuela`  
**Tecnologías:** React 19, TypeScript, Vite, `@stellar/freighter-api`, `@stellar/stellar-sdk`, Stellar Horizon Testnet, Lucide Icons.  

---

## 🌎 Sobre el Proyecto

En América Latina existe una gran cantidad de talento técnico en desarrollo de software, pero el acceso a oportunidades globales o pagos transfronterizos sin altas comisiones bancarias sigue siendo un obstáculo. 

**StellarChamba LATAM** es una aplicación descentralizada (dApp) pensada específicamente para la comunidad de desarrolladores de Latinoamérica. Conecta a empresas y protocolos Web3 con programadores calificados (especializados en Soroban, Rust, Smart Contracts y Frontend Web3), garantizando remuneraciones transparentes, inmediatas y de costo casi nulo pagadas directamente en **Stellar Lumens (XLM)** a la wallet de cada desarrollador.

---

## 🚀 Funcionalidades Principales

1. **Conexión de Wallet Stellar (Requisito fundamental):**
   - Integración nativa con la extensión oficial **Freighter** (`@stellar/freighter-api`).
   - Lectura de clave pública truncada con copia al portapapeles y visualización directa en [Stellar Expert](https://stellar.expert/explorer/testnet).
   - Indicador dinámico de estado de red (**Stellar Testnet**).
   - Modo explorador/demo incluido para facilitar la evaluación rápida en navegadores sin la extensión instalada.

2. **Consulta en Tiempo Real de Balances & Horizon API:**
   - Consulta directa del saldo en XLM de la cuenta conectada utilizando la API de **Horizon Testnet** (`https://horizon-testnet.stellar.org`).
   - Botón interactivo para refrescar el balance tras transacciones.

3. **Faucet de Pruebas (Friendbot Integrado):**
   - Botón de 1-clic para recargar automáticamente la wallet conectada con **10,000 XLM de prueba** vía el Friendbot oficial de Stellar (`https://friendbot.stellar.org`).

4. **Marketplace & Bounties para LATAM:**
   - Listado de proyectos y chambas categorizados por país (Costa Rica 🇨🇷, Colombia 🇨🇴, México 🇲🇽, Argentina 🇦🇷, Chile 🇨🇱, etc.) y área técnica (Soroban Smart Contracts, Frontend Web3, Seguridad, Backend).
   - Filtros dinámicos por tecnología, modalidad (Bounty, Gig, Full-time) y buscador en tiempo real.

5. **Postulación con Identidad Web3:**
   - Los desarrolladores pueden postularse a cualquier proyecto enviando su propuesta, experiencia y enlace a portafolio, vinculando su clave pública de Stellar como dirección de cobro.

6. **Liberación y Firma de Pagos On-Chain:**
   - Los creadores de proyectos pueden aprobar postulaciones y liberar la recompensa en XLM.
   - Construcción de la transacción con `@stellar/stellar-sdk` y firma con **Freighter**, generando un hash de transacción verificable en el explorador de bloques de Stellar Testnet.

7. **Publicación de Proyectos:**
   - Formulario para que empresas creen nuevos bounties estableciendo el monto de remuneración en XLM.

---

## 🦅 Uso de Stellar Raven MCP

Durante el desarrollo de esta aplicación se integró y consultó el servidor MCP oficial de Stellar, **Stellar Raven** (`https://raven.stellar.org/mcp`), para:
- Consultar los métodos vigentes de la API v3 de `@stellar/freighter-api` (`isConnected`, `requestAccess`, `getAddress`, `signTransaction`).
- Validar las buenas prácticas de construcción y serialización de operaciones de pago en XDR con `@stellar/stellar-sdk` sobre la red de pruebas (Testnet Passphrase).
- Configurar la integración con el servicio Friendbot y Horizon Testnet.

---

## 🛠️ Cómo ejecutar el proyecto localmente

### Prerrequisitos:
- [Node.js](https://nodejs.org/) (versión 18 o superior).
- Extensión [Freighter Wallet](https://www.freighter.app/) instalada en el navegador (configurada en red *Testnet*).

### Pasos:

1. Entra a la carpeta del proyecto:
   ```bash
   cd josue-valenzuela
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Abre la URL en tu navegador (por defecto `http://localhost:5173`).

5. Para compilar la versión de producción:
   ```bash
   npm run build
   ```
