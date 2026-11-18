import { defineConfig } from "vitest/config";

// Tests live next to the code they cover; only pure domain logic is tested.
export default defineConfig({
  test: {
    environment: "node",
    include: ["source/**/*.test.ts"],
  },
});
