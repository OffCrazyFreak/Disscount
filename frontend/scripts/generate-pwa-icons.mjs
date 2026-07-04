// One-off generator for the PWA icon set. Run from the frontend dir:
//   node scripts/generate-pwa-icons.mjs
// Produces the icons referenced by app/manifest.ts and layout metadata.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SRC = "public/disscount-logo.png";
const OUT = "public/icons";

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const white = { r: 255, g: 255, b: 255, alpha: 1 };

// "any"-purpose icon: the logo on a transparent canvas.
async function generateTransparent(size, file) {
  await sharp(SRC)
    .resize(size, size, { fit: "contain", background: transparent })
    .png()
    .toFile(path.join(OUT, file));
}

// maskable / apple icon: the logo centered on a solid background with padding
// so OS masks (circle, squircle) never clip it, and iOS gets no transparency.
async function generateOnBackground(size, logoRatio, background, file) {
  const logoSize = Math.round(size * logoRatio);

  const logo = await sharp(SRC)
    .resize(logoSize, logoSize, { fit: "contain", background: transparent })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(path.join(OUT, file));
}

await mkdir(OUT, { recursive: true });

await generateTransparent(192, "icon-192.png");
await generateTransparent(512, "icon-512.png");
await generateOnBackground(512, 0.66, white, "icon-maskable-512.png");
await generateOnBackground(180, 0.82, white, "apple-touch-icon-180.png");

console.log(`Generated PWA icons in ${OUT}/`);
