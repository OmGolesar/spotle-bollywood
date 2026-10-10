import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    // Order matters: longest prefix first so "@/frontend/..." isn't rewritten by "@".
    alias: [
      { find: "@/frontend", replacement: path.resolve(__dirname, "frontend") },
      { find: "@", replacement: path.resolve(__dirname, "src") },
    ],
  },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./frontend/test-setup.ts"],
    include: ["src/**/*.test.ts", "frontend/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      exclude: ["src/lib/mock.ts", "src/lib/types.ts"],
      reporter: ["text", "html"],
      thresholds: {
        lines: 90,
        statements: 90,
        branches: 90,
        functions: 90,
      },
    },
  },
});
