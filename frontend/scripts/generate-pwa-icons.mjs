// One-off generator for the brand icon set. Run from the frontend dir:
//   node scripts/generate-pwa-icons.mjs
// Produces the icons referenced by app/manifest.ts and layout metadata plus the
// legacy favicon.ico. All are the white cart on brand green; see
// scripts/lib/cart-source.mjs for the shared source.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { cartOnSquare, GREEN, ROOT } from "./lib/cart-source.mjs";

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

// Brand green fills every tile and the cart goes white. A white plate reads as
// empty space on a home screen full of saturated icons, and it is also what
// Android falls back to on its own, so the icon stops looking deliberate.
const onGreen = (size, ratio) => cartOnSquare(size, ratio, GREEN, "white");

// PWA "any"-purpose icons: generous crop, since nothing masks these.
await writeSrgb(path.join(ICONS, "icon-192.png"), await onGreen(192, 0.86));
await writeSrgb(path.join(ICONS, "icon-512.png"), await onGreen(512, 0.86));

// Maskable: cropped to the widest cart whose corners still clear the 80% safe
// zone. Shipped at both launcher sizes so Chrome never has to fall back to an
// "any" icon just because it wanted 192.
await writeSrgb(
  path.join(ICONS, "icon-maskable-192.png"),
  await onGreen(192, 0.7),
);
await writeSrgb(
  path.join(ICONS, "icon-maskable-512.png"),
  await onGreen(512, 0.7),
);

// Apple touch icon: no transparency, near-full crop.
await writeSrgb(
  path.join(ICONS, "apple-touch-icon-180.png"),
  await onGreen(180, 0.86),
);

// favicon.ico: line-art needs the tightest crop to survive 16px.
const frames = await Promise.all(
  [16, 32, 48].map(async (size) => ({
    size,
    data: await onGreen(size, 0.92),
  })),
);
await writeFile(FAVICON, pngsToIco(frames));

console.log("Generated PWA icons and favicon.ico.");
