---
name: stellar-raven-bootcamp
description: Consulta Stellar Raven y verifica una app básica de Stellar Testnet para Pura Vida Bootcamp. Úsalo al integrar Varial, antes Freighter, Horizon, wallets o al preparar la entrega del bootcamp.
disable-model-invocation: true
---

# Stellar Raven para el bootcamp

1. Conecta el MCP oficial `https://raven.stellar.org/mcp` y completa su autorización OAuth.
2. Consulta Raven antes de decidir el flujo de Varial o las respuestas de Horizon. Prefiere la documentación oficial de Stellar que Raven recupera para detalles de protocolo y API.
3. Guarda en el README de la app las preguntas hechas, los resultados que afectaron el código y la fecha. No afirmes haber consultado el MCP si solo leíste su sitio web.
4. Comprueba con tests conexión, red Testnet, cuenta inexistente y saldo nativo. Ejecuta `npm test` y `npm run build`.
5. Antes de entregar, revisa que la app esté en la carpeta del nombre completo, la rama sea `feature/tu-nombre`, haya cinco commits propios y el PR apunte a `main` del repositorio original.
