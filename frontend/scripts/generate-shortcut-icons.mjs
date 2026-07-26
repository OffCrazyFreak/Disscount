// One-off generator for the PWA app-shortcut icons. Run from the frontend dir:
//   node scripts/generate-shortcut-icons.mjs
// Produces the icons referenced by the shortcuts array in app/manifest.ts: the
// same lucide glyph the nav uses, white on brand green. Chrome accepts PNG only
// for shortcut icons, so the SVGs cannot be linked directly.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Eye, ListChecks, ScanBarcode } from "lucide-react";
import { GREEN } from "./lib/brand.mjs";
import { ROOT } from "./lib/cart-source.mjs";
import { SRGB } from "./lib/srgb.mjs";

const OUT = path.join(ROOT, "public/brand/shortcuts");

const SIZE = 192; // What Chrome asks for when a single shortcut icon is given.

// Lucide insets its art by roughly 2 of 24 units, so the ink lands near 0.55 of
// the canvas. Its diagonal then just clears the 80% safe-zone circle, which the
// corner-bracket glyphs actually reach into.
const GLYPH = Math.round(SIZE * 0.66);

// Same corner ratio as brand/icons/icon.svg (rx 96 on 512).
const RADIUS = Math.round(SIZE * (96 / 512));

// Keyed by navigation item id, since manifest.ts derives each src from it.
const SHORTCUTS = {
  scan: ScanBarcode,
  "shopping-lists": ListChecks,
  watchlist: Eye,
};

const ROUNDED = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">` +
    `<rect width="${SIZE}" height="${SIZE}" rx="${RADIUS}" ry="${RADIUS}" fill="#fff"/></svg>`,
);

// Rendering the component rather than a copied path keeps the shortcut icon and
// the in-app nav icon from ever drifting apart.
async function glyph(Icon) {
  const svg = renderToStaticMarkup(
    createElement(Icon, { size: GLYPH, color: "#ffffff", strokeWidth: 2 }),
  );

  return sharp(Buffer.from(svg)).png().toBuffer();
}

function tile(art, corners = []) {
  return sharp({
    create: { width: SIZE, height: SIZE, channels: 4, background: GREEN },
  })
    .composite([{ input: art, gravity: "centre" }, ...corners])
    .withIccProfile(SRGB)
    .png();
}

// Two tiles per shortcut, because one image cannot serve both jobs. The masked
// one must stay full bleed: Chrome hands it to Android as an adaptive-icon
// layer, where transparent corners are filled by the launcher rather than left
// alone. The unmasked one is drawn as-is in desktop jump lists, where a hard
// square reads as a blank block, so it keeps the brand corner radius.
async function writeTiles(id, Icon) {
  const art = await glyph(Icon);

  await tile(art).toFile(path.join(OUT, `${id}.png`));
  await tile(art, [{ input: ROUNDED, blend: "dest-in" }]).toFile(
    path.join(OUT, `${id}-any.png`),
  );
}

await mkdir(OUT, { recursive: true });

for (const [id, Icon] of Object.entries(SHORTCUTS)) {
  await writeTiles(id, Icon);
}

console.log(`Generated ${Object.keys(SHORTCUTS).length * 2} shortcut icons.`);
