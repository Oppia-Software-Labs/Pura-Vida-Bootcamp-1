# Entregable 1 · Pura Vida Bootcamp

**Estudiante:** David Calderon Soto  
**Rama:** `feature/david-calderon-soto`  
**Repositorio base:** [Oppia-Software-Labs/Pura-Vida-Bootcamp-1](https://github.com/Oppia-Software-Labs/Pura-Vida-Bootcamp-1)

---

## Stellar Pura Vida Dashboard & Wallet

Aplicación descentralizada interactiva construida sobre la red **Stellar Testnet**, diseñada como entregable para el Bootcamp Pura Vida. La aplicación permite a los usuarios conectar su billetera de Stellar, consultar su balance en tiempo real, fondear cuentas con fondos de prueba (Friendbot) e interactuar con la red Horizon.

El diseño y desarrollo de la aplicación fue guiado utilizando las especificaciones y herramientas del MCP oficial **Stellar Raven** (https://raven.stellar.org/).

### Características principales

1. **Conexión de Wallet Multi-proveedor:**
   - Soporte para **Freighter Wallet** (vía `@stellar/freighter-api`).
   - Soporte para **Albedo** (sin necesidad de instalar extensiones de navegador).
   - Modo explorador con ingreso manual de cualquier clave pública (`G...`) para inspección inmediata.
2. **Dashboard de Cuenta (Stellar Horizon Testnet):**
   - Consulta de balance en tiempo real de Lumens (`XLM`) y otros activos emitidos.
   - Estado de la cuenta y número de secuencia.
3. **Herramientas de Testnet:**
   - Botón de **Friendbot** integrado para fondear automáticamente con 10,000 XLM de prueba.
   - Generador instantáneo de pares de claves (`Keypair`) de Stellar para pruebas locales.
   - Historial de operaciones y transacciones recientes en la red de pruebas.

### Tecnologías utilizadas

- **HTML5 & CSS3 moderno**: Diseño responsivo con tarjetas de información, estados visuales y diseño amigable.
- **JavaScript (ES Modules)**:
  - `@stellar/freighter-api` para la integración con la billetera Freighter.
  - `@albedo-link/intent` para la autenticación y firma mediante Albedo.
  - `stellar-sdk` para la gestión de claves y formateo criptográfico.
  - API REST de **Stellar Horizon Testnet** (`https://horizon-testnet.stellar.org`).

### Cómo ejecutar la aplicación

No requiere compilación ni dependencias pesadas:

1. Abrir directamente el archivo `index.html` en cualquier navegador moderno:
   ```bash
   # Opción directa:
   xdg-open index.html   # en Linux
   open index.html       # en macOS
   ```
2. O servir con cualquier servidor web estático local:
   ```bash
   npx serve .
   # o
   python3 -m http.server 8080
   ```
3. Visitar `http://localhost:8080` en el navegador.

---
*Desarrollado por David Calderon Soto para el Pura Vida Bootcamp 2026.*
