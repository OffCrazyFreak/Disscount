// One-off generator for the brand icon set. Run from the frontend dir:
//   node scripts/generate-pwa-icons.mjs
// Produces the icons referenced by app/manifest.ts and layout metadata plus the
// legacy favicon.ico. All are the happy cart on white; see
// scripts/lib/cart-source.mjs for the shared source.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cartOnSquare, ROOT } from "./lib/cart-source.mjs";

const ICONS = path.join(ROOT, "public/brand/icons");
const FAVICON = path.join(ROOT, "src/app/favicon.ico");

// Wrap PNG frames in a minimal ICO container (browsers accept PNG-encoded
// entries), since sharp can't emit .ico directly.
function pngsToIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);

  const dir = Buffer.alloc(16 * frames.length);
  let offset = header.length + dir.length;

  frames.forEach(({ size, data }, i) => {
    const e = dir.subarray(i * 16, i * 16 + 16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
  });

  return Buffer.concat([header, dir, ...frames.map((f) => f.data)]);
}

// Tag PNGs sRGB so wide-gamut viewers colour-manage the green like the SVG.
async function writeSrgb(file, buffer) {
  await sharp(buffer).withIccProfile("srgb").png().toFile(file);
}

await mkdir(ICONS, { recursive: true });

// PWA "any"-purpose icons: white bg, generous crop.
await writeSrgb(path.join(ICONS, "icon-192.png"), await cartOnSquare(192, 0.8));
await writeSrgb(path.join(ICONS, "icon-512.png"), await cartOnSquare(512, 0.8));

// Maskable: tighter crop so OS circle/squircle masks never clip the cart.
await writeSrgb(
  path.join(ICONS, "icon-maskable-512.png"),
  await cartOnSquare(512, 0.6),
);

// Apple touch icon: no transparency, near-full crop.
await writeSrgb(
  path.join(ICONS, "apple-touch-icon-180.png"),
  await cartOnSquare(180, 0.82),
);

// favicon.ico: line-art needs the tightest crop to survive 16px.
const frames = await Promise.all(
  [16, 32, 48].map(async (size) => ({
    size,
    data: await cartOnSquare(size, 0.92),
  })),
);
await writeFile(FAVICON, pngsToIco(frames));

console.log("Generated PWA icons and favicon.ico.");
