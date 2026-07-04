// Verifies that every locale catalog in src/i18n/messages/ has exactly the same
// set of keys as the reference locale (hr). Run via `pnpm i18n:check`.
// Exits non-zero on any missing/extra key so CI fails when a translation is
// forgotten in one language.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const MESSAGES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "src",
  "i18n",
  "messages",
);

const REFERENCE = "hr";
const LOCALES = ["hr", "en", "de", "sl"];

function flattenKeys(obj, prefix = "") {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, path));
    } else {
      keys.push(path);
    }
  }

  return keys.sort();
}

function loadKeys(locale) {
  const raw = readFileSync(join(MESSAGES_DIR, `${locale}.json`), "utf8");
  return flattenKeys(JSON.parse(raw));
}

const reference = loadKeys(REFERENCE);
let hasError = false;

for (const locale of LOCALES) {
  if (locale === REFERENCE) continue;

  const keys = loadKeys(locale);
  const missing = reference.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !reference.includes(key));

  if (missing.length > 0) {
    hasError = true;
    console.error(`\n❌ ${locale}.json is MISSING ${missing.length} key(s):`);
    missing.forEach((key) => console.error(`   - ${key}`));
  }

  if (extra.length > 0) {
    hasError = true;
    console.error(`\n❌ ${locale}.json has ${extra.length} EXTRA key(s):`);
    extra.forEach((key) => console.error(`   + ${key}`));
  }
}

if (hasError) {
  console.error(
    "\ni18n parity check failed. Every locale must define the same keys as hr.\n",
  );
  process.exit(1);
}

console.log(
  `✅ i18n parity OK — ${reference.length} keys across ${LOCALES.join(", ")}.`,
);
