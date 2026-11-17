# Investigación y decisiones

Fecha: 16 de noviembre de 2026.

## Contexto del bootcamp

El repositorio exige una aplicación básica sobre Stellar apoyada por Stellar Raven y una sección para conectar una wallet. Las entregas existentes abarcan balances, propinas, educación y utilidades; Proofolio ocupa un espacio diferente al registrar contribuciones públicas entre personas sin quedar ligado a una startup específica.

## Stellar Raven

- Endpoint configurado: `https://raven.stellar.org/mcp`.
- Transporte: Streamable HTTP con OAuth.
- Estado local: servidor agregado y autenticación completada.
- La documentación oficial describe dos herramientas, `search` para descubrir operaciones y skills, y `execute` para componer consultas de solo lectura dentro de un entorno aislado.

Se consultó Raven durante esta implementación. Sus búsquedas oficiales confirmaron las guías de wallet, almacenamiento persistente y simulación de transacciones citadas abajo.

Consultas realizadas:

1. Conexión Varial y verificación de Testnet antes de solicitar una firma.
2. Diseño de almacenamiento persistente, índices acotados y extensión de TTL en Soroban.
3. Eventos, simulación de transacciones y generación de bindings TypeScript.

## Decisiones confirmadas con fuentes oficiales

### Wallet

La integración actual usa `@creit.tech/stellar-wallets-kit` v2.8.0. Se inicializa con `defaultModules()` y Testnet; el modal selecciona wallets compatibles. La red y su passphrase se comprueban tras la conexión. Las transacciones Soroban se simulan con el SDK generado, luego Stellar Wallets Kit firma el XDR.

Fuentes: [Stellar Wallets Kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit) y [guía oficial de simulación](https://developers.stellar.org/docs/learn/fundamentals/contract-development/contract-interactions/transaction-simulation#sdk-usage).

### Almacenamiento y TTL

Los registros por usuario no son configuración global ni caché descartable. Se guardan en almacenamiento persistente, con índices de máximo 50 elementos y extensión de TTL al escribir y leer. El contador global vive en almacenamiento de instancia.

Fuentes: [almacenamiento persistente](https://developers.stellar.org/docs/build/guides/storage/use-persistent) y [almacenamiento de contratos](https://developers.stellar.org/docs/learn/fundamentals/contract-development/storage).

### Datos públicos mínimos

Los tipos públicos se expresan con `#[contracttype]`; se guarda `owner/repo`, número de PR, tipo, wallets y fecha. No se almacena el título completo ni información personal de GitHub. La interfaz vuelve a consultar los metadatos visibles cuando los necesita.

Fuente: [tipos personalizados de contratos](https://developers.stellar.org/docs/learn/fundamentals/contract-development/types/custom-types).

### Firma segura

Toda llamada de escritura se simula antes de firmarse para obtener recursos y restauraciones necesarias. La UI muestra los datos que se firmarán y distingue rechazo de firma, error de simulación, fallo RPC y timeout.

## Investigación visual

ScreensDesign está conectado, pero sus búsquedas requieren una cuenta Pro. No se usaron resultados de esa herramienta. La revisión de interfaz usa patrones comunes de cronología y evidencia de proyectos, conexión de wallet reconocible y una revisión explícita antes de la firma; no atribuye estos patrones a una pantalla concreta.

- GitHub para cronologías y evidencia de contribuciones.
- Linear para densidad, jerarquía y estados compactos.
- Stripe para claridad previa a una acción firmada.

Las referencias no se copiarán literalmente. El objetivo es una página propia, clara y humana, sin estética cripto ni cuadrículas genéricas de métricas.
