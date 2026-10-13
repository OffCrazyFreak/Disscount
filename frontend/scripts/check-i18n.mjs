// Checks the message catalogs in src/i18n/messages against the Croatian source:
// same keys everywhere, valid ICU, the same {arguments} and <tags> as Croatian, and
// plural branches that match each language's CLDR categories.
//
// Usage: node scripts/check-i18n.mjs [--allow-missing]
// --allow-missing reports untranslated keys without failing (while translating).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createTranslator } from "next-intl";

const MESSAGES_DIR = join("src", "i18n", "messages");
const SOURCE = "hr";
const LOCALES = ["hr", "en", "it", "sl", "de"];
const allowMissing = process.argv.includes("--allow-missing");

// A JSON file that index.ts does not import never reaches the app, and tsc only
// types hr, so the other locales would silently fall back to Croatian.
function unregisteredNamespaces(locale) {
  const dir = join(MESSAGES_DIR, locale);
  const index = readFileSync(join(dir, "index.ts"), "utf8");
  const imported = new Set(
    [...index.matchAll(/from "\.\/(\w+)\.json"/g)].map((match) => match[1]),
  );
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((name) => !imported.has(name));
}

function loadLocale(locale) {
  const dir = join(MESSAGES_DIR, locale);
  const messages = {};
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    messages[file.replace(/\.json$/, "")] = JSON.parse(
      readFileSync(join(dir, file), "utf8"),
    );
  }
  return messages;
}

function flatten(object, prefix = "", out = new Map()) {
  for (const [key, value] of Object.entries(object)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") flatten(value, path, out);
    else out.set(path, value);
  }
  return out;
}

/**
 * A small ICU walker: collects argument names, plural/select branches and rich-text
 * tags, and reports unbalanced braces. Apostrophes quote per ICU: '' is a literal
 * quote and '{' starts a quoted span.
 */
function analyse(message) {
  const args = new Set();
  const tags = new Set();
  const plurals = [];
  const selects = [];
  let error = null;
  let i = 0;

  function skipQuoted() {
    // At a quote: '' is literal, '{...' or '}' or '<' starts a quoted span.
    if (message[i + 1] === "'") {
      i += 2;
      return;
    }
    if ("{}<".includes(message[i + 1] ?? "")) {
      const end = message.indexOf("'", i + 1);
      i = end === -1 ? message.length : end + 1;
      return;
    }
    i += 1;
  }

  function parseText(depth, inPlural) {
    while (i < message.length) {
      const ch = message[i];
      if (ch === "'") skipQuoted();
      else if (ch === "{") parseArgument(depth + 1);
      else if (ch === "}") {
        if (depth === 0) {
          error = "unexpected }";
          i += 1;
        }
        return;
      } else if (ch === "#" && inPlural) i += 1;
      else if (ch === "<") {
        const match = /^<\/?([a-zA-Z][\w-]*)\s*\/?>/.exec(message.slice(i));
        if (match) {
          tags.add(match[1]);
          i += match[0].length;
        } else i += 1;
      } else i += 1;
    }
    if (depth > 0) error = "unclosed {";
  }

  function parseArgument(depth) {
    i += 1;
    const header = /^\s*([^,}\s]+)\s*(?:,\s*(\w+)\s*(?:,\s*)?)?/.exec(
      message.slice(i),
    );
    if (!header) {
      error = "empty argument";
      return;
    }
    args.add(header[1]);
    const type = header[2];
    i += header[0].length;

    if (type === "plural" || type === "select" || type === "selectordinal") {
      const branches = [];
      while (i < message.length && message[i] !== "}") {
        const branch = /^\s*(offset:\d+\s*)?(=?[\w-]+)\s*\{/.exec(
          message.slice(i),
        );
        if (!branch) {
          if (/^\s*}/.test(message.slice(i))) {
            i += message.slice(i).indexOf("}");
            break;
          }
          error = `bad ${type} branch`;
          return;
        }
        branches.push(branch[2]);
        i += branch[0].length;
        parseText(depth, type !== "select");
        if (message[i] !== "}") {
          error = "unclosed branch";
          return;
        }
        i += 1;
      }
      if (type === "plural") plurals.push(branches);
      if (type === "select") selects.push(branches.toSorted().join("|"));
      if (!branches.includes("other")) error = `${type} without other`;
    } else {
      // Simple {name} or {name, number, ...}: skip to the closing brace.
      const close = message.indexOf("}", i);
      if (close === -1) {
        error = "unclosed {";
        return;
      }
      i = close;
    }

    if (message[i] !== "}") {
      error = "unclosed {";
      return;
    }
    i += 1;
  }

  parseText(0, false);
  return { args, tags, plurals, selects, error };
}

// Categories that actually occur for whole numbers; "many" in Italian or German only
// covers millions written in compact form, so it is not required.
function integerCategories(locale) {
  const rules = new Intl.PluralRules(locale);
  const seen = new Set();
  for (let n = 0; n <= 1000; n += 1) seen.add(rules.select(n));
  return seen;
}

function sameSet(a, b) {
  return a.size === b.size && [...a].every((value) => b.has(value));
}

const catalogs = Object.fromEntries(
  LOCALES.map((locale) => [locale, flatten(loadLocale(locale))]),
);
const source = catalogs[SOURCE];
const problems = [];
const missingCounts = {};

for (const locale of LOCALES) {
  const catalog = catalogs[locale];
  const required = integerCategories(locale);
  const allowed = new Set(
    new Intl.PluralRules(locale).resolvedOptions().pluralCategories,
  );
  let missing = 0;

  for (const key of source.keys()) {
    if (!catalog.has(key)) {
      missing += 1;
      if (!allowMissing) problems.push(`${locale} ${key}: missing`);
    }
  }
  for (const key of catalog.keys()) {
    if (!source.has(key)) problems.push(`${locale} ${key}: not in ${SOURCE}`);
  }
  missingCounts[locale] = missing;

  for (const name of unregisteredNamespaces(locale)) {
    problems.push(`${locale} ${name}.json: not imported in index.ts`);
  }

  const translatorErrors = [];
  const messages = {};
  for (const [key, value] of catalog) {
    if (typeof value !== "string") {
      problems.push(`${locale} ${key}: not a string`);
      continue;
    }
    if (!value.trim()) problems.push(`${locale} ${key}: empty`);

    const found = analyse(value);
    if (found.error) problems.push(`${locale} ${key}: ${found.error}`);

    if (source.has(key) && locale !== SOURCE) {
      const expected = analyse(String(source.get(key)));
      if (!sameSet(found.args, expected.args)) {
        problems.push(
          `${locale} ${key}: arguments {${[...found.args]}} differ from ${SOURCE} {${[...expected.args]}}`,
        );
      }
      if (!sameSet(new Set(found.selects), new Set(expected.selects))) {
        problems.push(
          `${locale} ${key}: select branches differ from ${SOURCE}`,
        );
      }
      if (!sameSet(found.tags, expected.tags)) {
        problems.push(
          `${locale} ${key}: tags <${[...found.tags]}> differ from ${SOURCE} <${[...expected.tags]}>`,
        );
      }
    }

    for (const branches of found.plurals) {
      const keywords = branches.filter((b) => !b.startsWith("="));
      const unknown = keywords.filter((b) => !allowed.has(b));
      // A plural with only "other" (and =N cases) just prints the number, so it
      // needs no grammatical forms.
      const absent =
        keywords.length > 1
          ? [...required].filter((c) => !keywords.includes(c))
          : [];
      if (unknown.length) {
        problems.push(
          `${locale} ${key}: plural categories ${unknown} do not exist in ${locale}`,
        );
      }
      if (absent.length) {
        problems.push(
          `${locale} ${key}: plural is missing ${absent} for ${locale}`,
        );
      }
    }

    messages[key] = value;
  }

  // next-intl's own parser, as a second opinion on message syntax.
  const nested = {};
  for (const [key, value] of Object.entries(messages)) {
    const parts = key.split(".");
    let node = nested;
    parts.slice(0, -1).forEach((part) => (node = node[part] ??= {}));
    node[parts.at(-1)] = value;
  }
  const t = createTranslator({
    locale,
    messages: nested,
    onError: (error) => translatorErrors.push(error),
  });
  for (const key of Object.keys(messages)) {
    const before = translatorErrors.length;
    const argNames = analyse(messages[key]).args;
    const values = Object.fromEntries([...argNames].map((name) => [name, 1]));
    const tagNames = analyse(messages[key]).tags;
    for (const tag of tagNames) values[tag] = (chunks) => chunks;
    try {
      tagNames.size ? t.rich(key, values) : t(key, values);
    } catch (error) {
      translatorErrors.push(error);
    }
    if (translatorErrors.length > before) {
      const error = translatorErrors.at(-1);
      problems.push(
        `${locale} ${key}: next-intl ${error.code ?? error.message}`,
      );
    }
  }
}

for (const [locale, count] of Object.entries(missingCounts)) {
  if (locale !== SOURCE) {
    console.log(`${locale}: ${count} of ${source.size} keys missing`);
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

console.log(`OK: ${source.size} keys checked in ${LOCALES.join(", ")}`);
