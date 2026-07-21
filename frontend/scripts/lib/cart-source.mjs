// Shared source for every rasterized brand icon (PWA icons, favicon, splash,
// white-bg logo). All of them start from the same happy-cart doodle so the
// mark never drifts between outputs.
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRC = path.join(ROOT, "public/doodle-cart-happy.svg");

// viewBox is "-1 6 68 50.5", so the art is 68 x 50.5 units (wider than tall).
const ASPECT = 50.5 / 68;

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

// The <style> block renders the animation's first frame (body hidden via
// stroke-dashoffset, wheels at scale 0). Drop it so we capture the finished
// cart, and size the <svg> up front so librsvg rasterizes it crisply.
async function frozenCart(width) {
  const svg = await readFile(SRC, "utf8");
  const height = Math.round(width * ASPECT);

  return svg
    .replace(/<style>[\s\S]*?<\/style>/, "")
    .replace(/<svg /, `<svg width="${width}" height="${height}" `);
}

// The green cart on a transparent canvas, fitted to a given width.
export async function renderCart(width) {
  return sharp(Buffer.from(await frozenCart(width))).png().toBuffer();
}

// The cart centered on a solid square, occupying `ratio` of the square's width.
// Line-art needs a tighter crop at small sizes to stay legible, hence the knob.
export async function cartOnSquare(size, ratio, background = WHITE) {
  const cart = await renderCart(Math.round(size * ratio));

  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: cart, gravity: "centre" }])
    .png()
    .toBuffer();
}

export { ROOT, ASPECT, WHITE, TRANSPARENT };
