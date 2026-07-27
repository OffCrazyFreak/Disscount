import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(HERE, "../../frontend/public");
const DIST = join(HERE, "dist");
const ORIGIN = "https://disscount.me";

// Outlook-only blocks are real HTML comments, so MailerLite's importer never
// rewrites the src inside them. Those stay absolute; everything else is bundled.
const MSO_BLOCK = /<!--\[if mso\]>[\s\S]*?<!\[endif\]-->/g;

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
  assets.forEach((path) =>
    copyFileSync(join(PUBLIC_DIR, path), join(stage, basename(path))),
  );

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
