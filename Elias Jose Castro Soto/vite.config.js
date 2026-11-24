import { fileURLToPath, URL } from "node:url"

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // @metamask/connect-stellar importa el Kit con scope "@creit.tech" (solo
      // lo tiene como devDependency); lo resolvemos al mismo paquete de JSR.
      "@creit.tech/stellar-wallets-kit": "@creit-tech/stellar-wallets-kit",
    },
  },
})
