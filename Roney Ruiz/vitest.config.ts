import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests live next to the code they cover; only pure entity logic is tested.
export default defineConfig({
  resolve: {
    alias: {
      "@config": fileURLToPath(new URL("./source/config", import.meta.url)),
      "@hooks": fileURLToPath(new URL("./source/hooks", import.meta.url)),
      "@shared": fileURLToPath(new URL("./source/shared", import.meta.url)),
      "@bloc": fileURLToPath(new URL("./source/bloc", import.meta.url)),
      "@helpers": fileURLToPath(new URL("./source/helpers", import.meta.url)),
      "@layouts": fileURLToPath(new URL("./source/layouts", import.meta.url)),
      "@pages": fileURLToPath(new URL("./source/pages", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["source/**/*.test.ts"],
  },
});
