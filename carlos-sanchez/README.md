# Proofolio

Proofolio es una dApp bilingüe para reconocer contribuciones públicas. Una wallet firma el reconocimiento de otra persona usando como evidencia un Pull Request fusionado; el perfil del contributor agrupa su historial y los proyectos que ayudó.

La demo funciona exclusivamente en Stellar Testnet, sin backend, GitHub OAuth, Mainnet ni pagos reales.

## Estado del proyecto

Este directorio se construye en seis commits revisables. La arquitectura prevista está en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) y las decisiones de investigación en [`docs/RESEARCH.md`](docs/RESEARCH.md).

## Alcance funcional

- Conexión de Varial con validación estricta de Testnet.
- Fondeo de la cuenta conectada mediante Friendbot.
- Búsqueda de perfiles por dirección Stellar.
- Validación de Pull Requests públicos fusionados mediante la API de GitHub.
- Emisión de reconocimientos inmutables mediante Soroban.
- Cronología de contribuciones y agrupación por proyecto.
- Interfaz ES/EN, responsive y accesible.

## Autor

Carlos Sanchez, GitHub [`ceshez`](https://github.com/ceshez).
