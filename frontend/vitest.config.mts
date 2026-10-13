import { fileURLToPath } from "node:url";

import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Most readers are in Croatia, and a zone with an offset catches the UTC-versus-local
// slips that a UTC machine would hide. Set here so every worker inherits it.
process.env.TZ = "Europe/Zagreb";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/components/ui/**",
      ],
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        // Compiled like next.config.ts compiles them, so a memoisation bug that only
        // exists in the compiled output fails here rather than in production.
        plugins: [
          react(),
          babel({
            presets: [
              reactCompilerPreset({
                environment: {
                  enablePreserveExistingMemoizationGuarantees: true,
                },
              }),
            ],
          }),
        ],
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["./src/test/setup-dom.ts"],
          // next-intl imports next/navigation without a file extension, which only
          // resolves once Vite transforms it instead of Node loading it directly.
          server: { deps: { inline: ["next-intl"] } },
        },
      },
    ],
  },
});
