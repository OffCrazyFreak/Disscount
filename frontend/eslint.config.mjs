import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import i18next from "eslint-plugin-i18next";

const ENV_MESSAGE =
  "Read environment variables through clientEnv (@/lib/env) or serverEnv (@/lib/server-env).";

const ENV_SELECTORS = [
  {
    selector:
      "MemberExpression[object.object.name='process'][object.property.name='env'][property.name!=/^(NODE_ENV|NEXT_RUNTIME)$/]",
    message: ENV_MESSAGE,
  },
  {
    selector:
      ":not(MemberExpression) > MemberExpression[object.name='process'][property.name='env']",
    message: ENV_MESSAGE,
  },
];

// Date slips are a recurring bug here: readers are in Zagreb and servers in UTC, so a calendar
// date always goes through a helper that names its zone.
const DATE_SELECTORS = [
  {
    selector:
      "CallExpression[callee.property.name=/^(get|set)(FullYear|Month|Date|Day|Hours|Minutes)$/]",
    message:
      "This reads or writes in the machine's zone. Use zagrebClock or addDays (@/lib/store-hours/zagreb-clock), or the UTC variant when UTC is meant.",
  },
  {
    selector:
      "CallExpression[callee.property.name=/^(slice|split)$/][callee.object.callee.property.name='toISOString']",
    message:
      "Cutting toISOString gives the UTC date, not the reader's. Use zagrebClock (@/lib/store-hours/zagreb-clock).",
  },
  {
    selector: "NewExpression[callee.name='Date'][arguments.length>=2]",
    message:
      "new Date(y, m, d) builds in the machine's zone. Use Date.UTC, or addDays (@/lib/store-hours/zagreb-clock).",
  },
];

const COMMENT_DIRECTIVE = /^\s*(eslint[- ]|@ts-|\/ *<(reference|amd))/;
const COMMENT_HISTORY = /\b(used to|previously|originally)\b/i;
const COMMENT_MAX_LINE_LENGTH = 120;

const commentRulesPlugin = {
  rules: {
    "one-line-why": {
      meta: {
        schema: [],
        messages: {
          multiline:
            "Keep a comment to one line, stating only a why the code cannot show.",
          history:
            "Keep history in the commit, not in a comment (used to, previously, originally).",
          tooLong: "Keep a comment line to 120 characters.",
        },
      },
      create(context) {
        const { sourceCode } = context;
        const standsAlone = (comment) =>
          comment.type === "Line" &&
          sourceCode.lines[comment.loc.start.line - 1]
            .trimStart()
            .startsWith("//");

        return {
          Program() {
            let previous = null;
            for (const comment of sourceCode.getAllComments()) {
              if (COMMENT_DIRECTIVE.test(comment.value)) {
                previous = null;
                continue;
              }
              // Adjacent // lines count as one comment, or the limit is one newline away from meaningless.
              const continuesPrevious =
                previous &&
                standsAlone(comment) &&
                standsAlone(previous) &&
                comment.loc.start.line === previous.loc.start.line + 1;
              if (
                comment.loc.start.line !== comment.loc.end.line ||
                continuesPrevious
              ) {
                context.report({ loc: comment.loc, messageId: "multiline" });
              }
              if (COMMENT_HISTORY.test(comment.value)) {
                context.report({ loc: comment.loc, messageId: "history" });
              }
              if (comment.loc.end.column > COMMENT_MAX_LINE_LENGTH) {
                context.report({ loc: comment.loc, messageId: "tooLong" });
              }
              previous = comment;
            }
          },
        };
      },
    },
  },
};

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
  // UI copy lives in src/i18n/messages; a literal in JSX means a string that never
  // gets translated. Data such as product names arrives through props, not literals.
  {
    files: ["src/**/*.tsx"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": [
        "error",
        {
          mode: "jsx-only",
          // Only attributes that carry visible or spoken text; everything else
          // (className, variant, seed...) is configuration, not copy.
          "jsx-attributes": {
            include: [
              "^aria-label$",
              "^aria-description$",
              "^aria-valuetext$",
              "^alt$",
              "^title$",
              "^placeholder$",
              "^label$",
              "^.*[lL]abel$",
              "^.*[tT]itle$",
              "^subtitle$",
              "^description$",
              "^heading$",
              "^text$",
              "^.*[mM]essage$",
              "^tooltip$",
              "^caption$",
              "^hint$",
              "^.*[tT]ext$",
              "^summary$",
              "^pitch$",
              "^eyebrow$",
              "^badge$",
            ],
          },
          words: {
            // Punctuation, numbers, units and proper nouns never need translating.
            exclude: [
              // The plugin compiles these without the u flag, so Unicode property classes fail.
              "^[\\s\\d.,:;!?()\\[\\]{}%+\\-/|*=<>&#'\"\\u00b7\\u2022\\u00d7\\u2013\\u2014\\u201e\\u201c\\u201d\\u2018\\u2019\\u2026\\u20ac$]*$",
              "^Disscount$",
              "^disscount$",
              "^GitHub$",
              "^LinkedIn$",
              "^Jakov Jakovac$",
              "^€$",
            ],
          },
        },
      ],
    },
  },
  // Legal pages stay Croatian until they are rewritten and translated; emails
  // render outside Next and are checked separately.
  {
    files: [
      "src/app/[[]locale]/privacy-policy/**",
      "src/app/[[]locale]/terms-of-service/**",
      "src/app/[[]locale]/data-deletion/**",
      "src/components/custom/legal/**",
      "src/app/global-error.tsx",
      "src/app/og/**",
    ],
    rules: { "i18next/no-literal-string": "off" },
  },
  // Every variable goes through the validated env modules. NODE_ENV and NEXT_RUNTIME stay
  // literal because the bundler replaces them and drops the dead branch.
  {
    files: ["src/**/*.{ts,tsx}", "sentry.*.config.ts"],
    ignores: [
      "src/lib/env.ts",
      "src/lib/server-env.ts",
      "src/**/*.test.{ts,tsx}",
      "src/test/**",
    ],
    rules: {
      "no-restricted-syntax": ["error", ...ENV_SELECTORS, ...DATE_SELECTORS],
    },
  },
  // The one module allowed to do clock arithmetic, because it holds the Zagreb conversion.
  {
    files: ["src/lib/store-hours/zagreb-clock.ts"],
    rules: { "no-restricted-syntax": ["error", ...ENV_SELECTORS] },
  },
  // Test fixtures pass literal labels; they are inputs, never shown to anyone.
  {
    files: ["src/**/*.test.tsx", "src/test/**"],
    rules: { "i18next/no-literal-string": "off" },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    plugins: { comments: commentRulesPlugin },
    rules: { "comments/one-line-why": "error" },
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
