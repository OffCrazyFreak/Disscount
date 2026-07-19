// One-off rasterizer for the happy-cart doodle. Run from the frontend dir:
//   node scripts/generate-cart-doodle.mjs
// Produces transparent PNG + WebP at a few widths for in-app and promo use.
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SRC = "public/doodle-cart-happy.svg";
const OUT = "public/doodle-cart-happy";

// viewBox is "-1 6 68 50.5", so the art is 68 x 50.5 units.
const ASPECT = 50.5 / 68;
const WIDTHS = [512, 1024, 2048];

// librsvg renders the static declared state, which is the animation's first
// frame (body hidden via stroke-dashoffset, wheels at scale 0). Drop the
// <style> block so we capture the finished cart instead.
function freezeFinalFrame(svg, width) {
  const height = Math.round(width * ASPECT);

  return svg
    .replace(/<style>[\s\S]*?<\/style>/, "")
    .replace(/<svg /, `<svg width="${width}" height="${height}" `);
}

async function generate(svg, width) {
  const base = sharp(Buffer.from(freezeFinalFrame(svg, width)));
  const stem = path.join(OUT, `cart-${width}`);

  await base.clone().png().toFile(`${stem}.png`);
  await base.clone().webp({ lossless: true }).toFile(`${stem}.webp`);
}

const svg = await readFile(SRC, "utf8");
await mkdir(OUT, { recursive: true });

for (const width of WIDTHS) {
  await generate(svg, width);
}

console.log(`Generated cart doodle PNG + WebP in ${OUT}/`);
