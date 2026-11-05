// Usage: node scripts/i18n-add-namespace.mjs <namespace>
// Creates src/i18n/messages/<locale>/<namespace>.json in every locale and registers
// it in each locale's index.ts. Existing files are left untouched.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LOCALES = ["hr", "en", "it", "sl", "de"];
const namespace = process.argv[2];

if (!namespace || !/^[a-z][A-Za-z0-9]*$/.test(namespace)) {
  console.error("Give a camelCase namespace name, e.g. shoppingLists");
  process.exit(1);
}

for (const locale of LOCALES) {
  const dir = join("src", "i18n", "messages", locale);
  const file = join(dir, `${namespace}.json`);
  if (!existsSync(file)) writeFileSync(file, "{}\n");

  const indexPath = join(dir, "index.ts");
  const names = [
    ...readFileSync(indexPath, "utf8").matchAll(/^import (\w+) from/gm),
  ].map((match) => match[1]);
  if (!names.includes(namespace)) names.push(namespace);
  names.sort();

  const imports = names
    .map((name) => `import ${name} from "./${name}.json";`)
    .join("\n");
  writeFileSync(
    indexPath,
    `${imports}\n\nconst messages = {\n${names.map((name) => `  ${name},`).join("\n")}\n};\n\nexport default messages;\n`,
  );
}

console.log(`Namespace "${namespace}" ready in ${LOCALES.join(", ")}`);
