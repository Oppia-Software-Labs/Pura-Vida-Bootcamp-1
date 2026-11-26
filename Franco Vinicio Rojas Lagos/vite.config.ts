import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@creit.tech/stellar-wallets-kit": "@creit-tech/stellar-wallets-kit",
    },
  },
  build: {
    target: "esnext",
  },
});
