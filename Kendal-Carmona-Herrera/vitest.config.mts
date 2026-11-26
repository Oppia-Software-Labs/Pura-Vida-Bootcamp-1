import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * The suite covers pure modules only: reserve arithmetic and payment validation.
 * That is why there is no DOM environment and no React testing library here —
 * rendering is verified in the browser, not simulated.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
