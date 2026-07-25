// One-off generator for the PWA app-shortcut icons. Run from the frontend dir:
//   node scripts/generate-shortcut-icons.mjs
// Produces the icons referenced by the shortcuts array in app/manifest.ts: the
// same lucide glyph the nav uses, brand green on a white tile. Chrome accepts
// PNG only for shortcut icons, so the SVGs cannot be linked directly.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Eye, ListChecks, ScanBarcode } from "lucide-react";
import { ROOT, WHITE } from "./lib/cart-source.mjs";

const OUT = path.join(ROOT, "public/brand/shortcuts");

const SIZE = 192; // What Chrome asks for when a single shortcut icon is given.
const GREEN = "#2ec50d"; // --primary

// Full bleed and declared maskable, so Android masks the tile itself. A tile
// with its own rounded corners gets shrunk onto a second white plate instead,
// which is what left the glyph tiny and the corners poking past the mask.
//
// Lucide insets its art by roughly 2 of 24 units, so the ink lands near 0.55 of
// the canvas. Its diagonal then just clears the 80% safe-zone circle, which the
// corner-bracket glyphs actually reach into.
const GLYPH = Math.round(SIZE * 0.66);

// Keyed by navigation item id, since manifest.ts derives each src from it.
const SHORTCUTS = {
  scan: ScanBarcode,
  "shopping-lists": ListChecks,
  watchlist: Eye,
};

// Rendering the component rather than a copied path keeps the shortcut icon and
// the in-app nav icon from ever drifting apart.
async function glyph(Icon) {
  const svg = renderToStaticMarkup(
    createElement(Icon, { size: GLYPH, color: GREEN, strokeWidth: 2 }),
  );

  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function writeTile(id, Icon) {
  await sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: WHITE },
  })
    .composite([{ input: await glyph(Icon), gravity: "centre" }])
    .withIccProfile("srgb")
    .png()
    .toFile(path.join(OUT, `${id}.png`));
}

await mkdir(OUT, { recursive: true });

for (const [id, Icon] of Object.entries(SHORTCUTS)) {
  await writeTile(id, Icon);
}

console.log(`Generated ${Object.keys(SHORTCUTS).length} shortcut icons.`);
