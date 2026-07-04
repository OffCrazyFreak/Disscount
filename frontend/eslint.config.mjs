import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import i18next from "eslint-plugin-i18next";

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

  // Enforce that user-facing JSX text goes through next-intl (no hardcoded
  // strings — this is what keeps translations from regressing). Only JSX text
  // nodes are checked; plain .ts (schemas/constants/mock data) and technical
  // attributes are ignored to avoid noise.
  {
    files: ["src/**/*.tsx"],
    ignores: [
      "src/components/ui/**", // shadcn primitives (library code)
      "src/components/custom/sidebar-08/**", // unused scaffold
      "src/components/shadcn-studio/**", // unused scaffold
      "src/emails/**", // localized via the email service, not next-intl
      // Unused landing-page scaffolds (only HeroSection is rendered).
      "src/app/(root)/components/sections/features-section.tsx",
      "src/app/(root)/components/sections/features-section2.tsx",
      "src/app/(root)/components/sections/pricing-section.tsx",
      "src/app/(root)/components/sections/stats-section.tsx",
      "src/app/(root)/components/sections/stores-section.tsx",
    ],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": [
        "error",
        {
          mode: "jsx-only",
          message:
            "Hardcoded string. Use next-intl (useTranslations) instead.",
          // Check JSX text plus these user-visible attributes only.
          "jsx-attributes": {
            include: ["placeholder", "alt", "title", "aria-label", "label"],
          },
          // Don't flag the key argument of translation/util calls, e.g.
          // t("key"), tCommon("key"), nav.label("id"), form.register("email"),
          // "x".localeCompare(y, "hr").
          callees: {
            exclude: [
              "^t$",
              "^t[A-Z]\\w*$",
              "^tv$",
              "rich",
              "label",
              "short",
              "localeCompare",
              "register",
              "watch",
              "setValue",
              "getValues",
              "useTranslations",
              "getTranslations",
            ],
          },
          words: {
            exclude: [
              // symbol / number / emoji-only text (separators, prices, etc.)
              "^[^A-Za-zČĆŽŠĐčćžšđ]*$",
              // hex color examples (e.g. #ffffff placeholder)
              "^#[0-9A-Fa-f]{3,8}$",
              // brand + proper names + universal tokens (not translated)
              "Disscount",
              "disscount",
              "Jakov Jakovac",
              "GitHub",
              "LinkedIn",
              "N/A",
            ],
          },
        },
      ],
    },
  },
]);

export default eslintConfig;
