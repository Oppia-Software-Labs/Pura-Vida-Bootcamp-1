import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      buffer: "buffer",
    },
  },
  // Blend testnet faucet (USDC de prueba) no envía cabeceras CORS → proxy
  server: {
    proxy: {
      "/blend-faucet": {
        target: "https://ewqw4hx7oa.execute-api.us-east-1.amazonaws.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/blend-faucet/, ""),
      },
    },
  },
  preview: {
    proxy: {
      "/blend-faucet": {
        target: "https://ewqw4hx7oa.execute-api.us-east-1.amazonaws.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/blend-faucet/, ""),
      },
    },
  },
  optimizeDeps: {
    include: ["buffer"],
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          stellar: ["@stellar/stellar-sdk"],
          recharts: ["recharts"],
          "wallets-kit": ["@creit.tech/stellar-wallets-kit"],
        },
      },
    },
  },
});
