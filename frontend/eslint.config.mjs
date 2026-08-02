import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Serwist writes the bundled service worker into public/ on every build.
    "public/sw*",
  ]),
  // The React Compiler "set-state-in-effect" heuristic fires on our intentional
  // SSR-safe deferred reads and external-state syncs; keep it visible as a
  // warning instead of a build-blocking error.
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      // An error, not a warning: pnpm lint exits 0 on warnings, so at warn level
      // this surfaced in the editor and never blocked anything, and dead imports
      // accumulated unnoticed. The ^_ patterns below are the escape hatch.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // shadcn primitives under components/ui are vendored/generated - don't lint
  // them for the React Compiler rules.
  {
    files: ["src/components/ui/**"],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
]);

export default eslintConfig;
