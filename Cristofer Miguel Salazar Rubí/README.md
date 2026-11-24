# Folio

Lectura entre personas. Folio es un marketplace peer-to-peer de ediciones breves: una persona comparte un libro, otra paga un depósito para leerlo y, al terminar, deja una reseña y recibe un sello de lectura on-chain.

## Qué hace

- Catálogo de libros publicados por anfitriones.
- Conexión de wallet de Stellar (Albedo, Varial, xBull, Rabet, LOBSTR).
- Depósito de lectura en XLM con reparto transparente: **95% al anfitrión, 5% a Folio**.
- Pago directo entre wallets, sin custodia de fondos.
- Lector integrado por capítulos, con progreso, tamaño de letra y temas de lectura.
- Reseña obligatoria al terminar.
- Emisión de **un sello de lectura por libro** en Stellar Testnet, con un token distinto para cada obra.
- Biblioteca personal: lecturas, sellos, reseñas y libros publicados.
- Estudio de publicación para crear nuevas ediciones breves.

## Cómo funciona el dinero

Cuando alguien abre un libro, la app construye una sola transacción de Stellar con tres operaciones:

1. `changeTrust` para habilitar el sello del libro en la wallet del lector.
2. Pago del **95%** del depósito directo a la wallet del anfitrión.
3. Pago del **5%** a la cuenta de Folio.

La wallet del lector firma la transacción. Folio nunca recibe ni retiene el depósito completo.

## Cómo funciona el sello de lectura

Cada libro tiene un asset code propio, por ejemplo `FOLIOBFE51C`. Después de que el lector termina el libro y publica su reseña:

- El servidor verifica que la compra exista y que la reseña sea válida.
- Emite **1 unidad** del token del libro a la wallet del lector.
- El lector recibe el sello y puede verlo en Stellar Expert.

El trustline se limita a 1 unidad para que cada sello funcione como una credencial única de esa lectura.

El acceso al lector se guarda en el navegador donde se hizo la compra. El sello, en cambio, vive en la wallet y puede verificarse on-chain desde cualquier dispositivo.

## Stack

- React 19 + TypeScript + Vite
- React Router
- Express 5 + Zod
- `@stellar/stellar-sdk` para Horizon, transacciones y emisión
- `@creit.tech/stellar-wallets-kit` para la conexión multi-wallet
- Almacenamiento JSON atómico en el servidor, sin base de datos externa

## Desarrollo local

```bash
npm install
npm run dev
```

- App: `http://localhost:5173`
- API: `http://localhost:8787`

El primer arranque crea una cuenta emisora de Testnet, la fondea con Friendbot y guarda su llave en `server/data/issuer.json` (ignorado por git). No hace falta configurar variables para probar.

Para producción:

```bash
npm run build
npm start
```

`npm start` sirve la app compilada y la API desde el mismo puerto (`PORT`, por defecto `8787`).

## Variables opcionales

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto del servidor. Default `8787`. |
| `STELLAR_ISSUER_SECRET` | Llave secreta de la cuenta emisora. Si no existe, se genera y persiste en `server/data/issuer.json`. |

Nunca se expone ni se registra la llave secreta.

## Estructura

```text
shared/
  types.ts              Contrato de datos compartido
server/
  index.ts              API Express y validación
  stellar.ts            Cuenta emisora, quote, verificación y emisión
  store.ts              Persistencia y estadísticas
  seed-books.ts         Catálogo inicial de dominio público
src/
  components/           Portadas, checkout, lector, reseñas, sellos
  hooks/                Sesión de wallet
  pages/                Catálogo, libro, lector, biblioteca, publicación
  lib/                  API client, formato, Stellar y storage local
  FolioProvider.tsx     Config, biblioteca y wallet global
```

## Red

Todo corre en **Stellar Testnet**. Los XLM y los sellos no tienen valor real. No uses direcciones ni fondos de Mainnet.

Los libros iniciales son textos de dominio público de autores clásicos, presentados como ediciones breves de demostración. Los anfitriones nuevos publican su propio contenido.
