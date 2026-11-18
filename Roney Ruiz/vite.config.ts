import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@config": fileURLToPath(new URL("./source/config", import.meta.url)),
      "@hooks": fileURLToPath(new URL("./source/hooks", import.meta.url)),
      "@shared": fileURLToPath(new URL("./source/shared", import.meta.url)),
      "@bloc": fileURLToPath(new URL("./source/bloc", import.meta.url)),
    },
  },
});
