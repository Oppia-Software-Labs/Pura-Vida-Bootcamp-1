import { defineConfig } from "vite";

export default defineConfig({
  // 127.0.0.1 (not "localhost", which can resolve to ::1) to match the API's loopback bind.
  server: { proxy: { "/api": "http://127.0.0.1:8787" } },
  preview: { proxy: { "/api": "http://127.0.0.1:8787" } },
});
