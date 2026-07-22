// Reusable optimizer for the store-chain logos. Run from the frontend dir:
//   node scripts/optimize-store-logos.mjs
// Resizes every logo in public/store-chains/ to fit within MAX_SIZE and re-encodes
// it losslessly, overwriting only when that saves at least MIN_SAVING. Lossless keeps
// quality intact on every run, and the saving threshold absorbs the tiny byte-level
// drift of re-encoding, so the script is safe to re-run whenever you add a logo.
import sharp from "sharp";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const LOGOS_DIR = path.join(process.cwd(), "public/store-chains");
const MAX_SIZE = 256;
const MIN_SAVING = 0.05;

async function optimize(file) {
  const filePath = path.join(LOGOS_DIR, file);
  const original = await readFile(filePath);

  const optimized = await sharp(original)
    .resize({
      width: MAX_SIZE,
      height: MAX_SIZE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();

  const changed = optimized.length <= original.length * (1 - MIN_SAVING);
  if (changed) await writeFile(filePath, optimized);

  return {
    file,
    before: original.length,
    after: changed ? optimized.length : original.length,
    changed,
  };
}

const files = (await readdir(LOGOS_DIR)).filter((f) => f.endsWith(".png"));
const results = await Promise.all(files.map(optimize));

const kb = (bytes) => (bytes / 1024).toFixed(1) + " KB";
let before = 0;
let after = 0;
let shrunk = 0;

for (const r of results.sort(
  (a, b) => b.before - b.after - (a.before - a.after),
)) {
  before += r.before;
  after += r.after;
  if (r.changed) {
    shrunk++;
    console.log(`  ${r.file.padEnd(22)} ${kb(r.before)} -> ${kb(r.after)}`);
  }
}

const saved = Math.round((1 - after / before) * 100);
console.log(
  `\nOptimized ${shrunk}/${files.length} logos (${files.length - shrunk} already optimal).`,
);
console.log(`Total: ${kb(before)} -> ${kb(after)} (-${saved}%).`);
