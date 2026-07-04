// One-off generator for the manifest `screenshots` (branded promo cards shown
// in Chrome's richer install dialog). Run from the frontend dir:
//   node scripts/generate-pwa-screenshots.mjs
// These are placeholder brand cards — swap them for real app captures whenever
// you have them; the manifest wiring stays the same.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_LOGO = path.join(ROOT, "public/disscount-logo.png");
const OUT = path.join(ROOT, "public/screenshots");

const NAVY = "#143a5a";
const GRAY = "#6b7280";
const GREEN = "#2ec50d";
const TAGLINE = "Pronađi najbolje cijene u Hrvatskoj";

async function generateScreenshot({ width, height, logoSize, logoTop, fontSize, file }) {
  const centerX = width / 2;
  const wordmarkY = logoTop + logoSize + fontSize;
  const accentY = wordmarkY + fontSize * 0.35;
  const taglineY = accentY + fontSize * 0.9;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#ffffff" />
      <text x="${centerX}" y="${wordmarkY}" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="${NAVY}">Disscount</text>
      <rect x="${centerX - 110}" y="${accentY}" width="220" height="8" rx="4" fill="${GREEN}" />
      <text x="${centerX}" y="${taglineY}" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(fontSize * 0.42)}" fill="${GRAY}">${TAGLINE}</text>
    </svg>`;

  const logo = await sharp(SRC_LOGO)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp(Buffer.from(svg))
    .composite([{ input: logo, top: logoTop, left: Math.round((width - logoSize) / 2) }])
    .png()
    .toFile(path.join(OUT, file));
}

await mkdir(OUT, { recursive: true });

await generateScreenshot({
  width: 1080,
  height: 1920,
  logoSize: 420,
  logoTop: 560,
  fontSize: 110,
  file: "screenshot-narrow.png",
});

await generateScreenshot({
  width: 1920,
  height: 1080,
  logoSize: 300,
  logoTop: 230,
  fontSize: 96,
  file: "screenshot-wide.png",
});

console.log("Generated PWA screenshots in public/screenshots/");
