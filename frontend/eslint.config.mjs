import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // The React Compiler "set-state-in-effect" heuristic fires on our intentional
  // SSR-safe deferred reads and external-state syncs; keep it visible as a
  // warning instead of a build-blocking error.
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
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
