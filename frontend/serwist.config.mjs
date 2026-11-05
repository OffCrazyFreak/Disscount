// Runs after `next build` (see the build script), because it precaches what the build emitted.
import { randomUUID } from "node:crypto";
import { serwist } from "@serwist/next/config";
import { DEFAULT_LOCALE, LOCALES } from "./src/i18n/locales.ts";
import { PRECACHED_PAGE_PATHS } from "./src/lib/pwa/precached-pages.ts";

const LOCALE_PREFIXES = LOCALES.filter((locale) => locale !== DEFAULT_LOCALE);

export default await serwist(
  {
    swSrc: "src/app/sw.ts",
    swDest: "public/sw.js",
    // Only build output: precaching public/ would download 7 MB of images on install.
    globPatterns: [".next/static/**/*.{js,mjs,css,woff2,ttf,json,webmanifest}"],
    // Turbopack also emits MapLibre's dev builds, which no page loads.
    globIgnores: [".next/static/media/*-dev.*"],
    // One copy serves everyone on the device, so only pages known to hold no account data go in.
    precachePrerendered: false,
    // A fresh revision per build keeps each page in step with the chunks it loads.
    additionalPrecacheEntries: [
      "",
      ...LOCALE_PREFIXES.map((l) => `/${l}`),
    ].flatMap((prefix) =>
      PRECACHED_PAGE_PATHS.map((path) => ({
        url: `${prefix}${path}`,
        revision: randomUUID(),
      })),
    ),
  },
  // Only these fields are read; loading next.config.ts again would rerun Sentry's wrapper.
  { distDir: ".next", basePath: "", assetPrefix: "" },
);
