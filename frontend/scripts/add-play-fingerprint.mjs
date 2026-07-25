// Adds a SHA-256 certificate fingerprint to the Digital Asset Links file. Run
// from the frontend dir:
//   node scripts/add-play-fingerprint.mjs AA:BB:CC:...
// Use it for the Play App Signing certificate, which Google generates when the
// first bundle is uploaded and which differs from our upload certificate. The
// script only ever appends, so the existing upload fingerprint survives and
// both directly installed and Play-installed builds keep verifying.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_LINKS = path.join(ROOT, "public/.well-known/assetlinks.json");
const PACKAGE_NAME = "me.disscount.app";
const FINGERPRINT_PATTERN = /^[0-9A-F]{2}(:[0-9A-F]{2}){31}$/;

function normalize(fingerprint) {
  return fingerprint.trim().toUpperCase();
}

const [input] = process.argv.slice(2);

if (!input) {
  console.error("Usage: node scripts/add-play-fingerprint.mjs <SHA-256>");
  process.exit(1);
}

const fingerprint = normalize(input);

if (!FINGERPRINT_PATTERN.test(fingerprint)) {
  console.error(
    `Not a SHA-256 fingerprint: expected 32 colon-separated hex bytes, got "${input}".`,
  );
  process.exit(1);
}

const statements = JSON.parse(await readFile(ASSET_LINKS, "utf8"));
const statement = statements.find(
  (entry) => entry.target?.package_name === PACKAGE_NAME,
);

if (!statement) {
  console.error(`No statement for ${PACKAGE_NAME} in ${ASSET_LINKS}.`);
  process.exit(1);
}

const existing = statement.target.sha256_cert_fingerprints;

if (existing.map(normalize).includes(fingerprint)) {
  console.log(`Already present, nothing to do:\n  ${fingerprint}`);
  process.exit(0);
}

existing.push(fingerprint);
await writeFile(ASSET_LINKS, `${JSON.stringify(statements, null, 2)}\n`);

console.log(
  `Added ${fingerprint}\n${existing.length} fingerprint(s) now trusted. Deploy for the change to take effect.`,
);
