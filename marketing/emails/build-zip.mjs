import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(HERE, "../../frontend/public");
const DIST = join(HERE, "dist");
const ORIGIN = "https://disscount.me";

// Outlook-only blocks are real HTML comments, so MailerLite's importer never
// rewrites the src inside them. Those stay absolute; everything else is bundled.
const MSO_BLOCK = /<!--\[if mso\]>[\s\S]*?<!\[endif\]-->/g;

/**
 * Resolves an asset inside frontend/public and refuses anything that escapes it.
 * The src is repo-owned so this is not a live vulnerability; the realistic case
 * is a typo'd relative path quietly bundling a file from outside public/.
 */
function resolveAsset(path) {
  const full = resolve(PUBLIC_DIR, `.${path}`);

  if (full !== PUBLIC_DIR && !full.startsWith(PUBLIC_DIR + sep)) {
    throw new Error(`asset escapes frontend/public: ${path}`);
  }

  if (!existsSync(full)) {
    throw new Error(`asset not found in frontend/public: ${path}`);
  }

  return full;
}

function collectAndRewrite(html) {
  const assets = new Set();
  const guarded = [];

  const withoutMso = html.replace(MSO_BLOCK, (block) => {
    guarded.push(block);

    return `@@MSO${guarded.length - 1}@@`;
  });

  const rewritten = withoutMso.replace(
    new RegExp(`${ORIGIN}(/[^"')\\s]+\\.(?:png|jpe?g|gif|webp))`, "g"),
    (_match, path) => {
      assets.add(path);

      return basename(path);
    },
  );

  const restored = rewritten.replace(
    /@@MSO(\d+)@@/g,
    (_m, i) => guarded[Number(i)],
  );

  return { html: restored, assets: [...assets] };
}

function buildZip(file) {
  const name = basename(file, ".html");
  const stage = join(DIST, name);

  rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });

  const { html, assets } = collectAndRewrite(
    readFileSync(join(HERE, file), "utf8"),
  );

  writeFileSync(join(stage, `${name}.html`), html);

  // Flattened to a basename in the zip, so two assets sharing one filename would
  // silently overwrite each other while both src values pointed at the survivor.
  const seen = new Map();

  assets.forEach((path) => {
    const file = basename(path);
    const previous = seen.get(file);

    if (previous && previous !== path) {
      throw new Error(
        `asset name collision in ${name}: ${previous} and ${path} both flatten to ${file}`,
      );
    }

    seen.set(file, path);
    copyFileSync(resolveAsset(path), join(stage, file));
  });

  const zip = join(DIST, `${name}.zip`);

  rmSync(zip, { force: true });
  execFileSync("zip", [
    "-jq",
    zip,
    ...readdirSync(stage).map((f) => join(stage, f)),
  ]);
  rmSync(stage, { recursive: true, force: true });

  const bundled = assets.map((path) => basename(path)).join(", ");

  console.log(`${name}.zip  ${assets.length} slika: ${bundled}`);
}

mkdirSync(DIST, { recursive: true });
readdirSync(HERE)
  .filter((f) => f.endsWith(".html"))
  .forEach(buildZip);
