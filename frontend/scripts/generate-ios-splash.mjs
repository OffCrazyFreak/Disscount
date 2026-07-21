// One-off generator for iOS launch (splash) screens. Run from the frontend dir:
//   node scripts/generate-ios-splash.mjs
// iOS ignores the web manifest for launch screens and instead shows the image
// referenced by a device-matched <link rel="apple-touch-startup-image">.
// The device list is shared with the <AppleSplashScreens> component
// (src/constants/ios-splash-screens.json) so the tags and files never drift.
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { renderCart, ROOT, WHITE as BACKGROUND } from "./lib/cart-source.mjs";

const OUT = path.join(ROOT, "public/splash");
const WORDMARK = path.join(ROOT, "public/brand/logo/wordmark/wordmark-rgb.png");

const CART_RATIO = 0.35; // cart width vs the shorter edge (matches the old size)
const WORDMARK_RATIO = 0.55; // wordmark sits below as a smaller label
const WM_ASPECT = 331 / 1938;

const devices = JSON.parse(
  await readFile(
    path.join(ROOT, "src/constants/ios-splash-screens.json"),
    "utf8",
  ),
);

await mkdir(OUT, { recursive: true });

for (const device of devices) {
  const pxWidth = device.width * device.ratio;
  const pxHeight = device.height * device.ratio;
  const short = Math.min(pxWidth, pxHeight);

  const cartWidth = Math.round(short * CART_RATIO);
  const wmWidth = Math.round(short * WORDMARK_RATIO);
  const wmHeight = Math.round(wmWidth * WM_ASPECT);
  const gap = Math.round(short * 0.04);

  const cart = await renderCart(cartWidth);
  const cartHeight = Math.round(cartWidth * (50.5 / 68));
  const wordmark = await sharp(WORDMARK)
    .resize({ width: wmWidth })
    .png()
    .toBuffer();

  const blockHeight = cartHeight + gap + wmHeight;
  const top = Math.round((pxHeight - blockHeight) / 2);

  await sharp({
    create: {
      width: pxWidth,
      height: pxHeight,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([
      { input: cart, left: Math.round((pxWidth - cartWidth) / 2), top },
      {
        input: wordmark,
        left: Math.round((pxWidth - wmWidth) / 2),
        top: top + cartHeight + gap,
      },
    ])
    .withIccProfile("srgb")
    .png()
    .toFile(path.join(OUT, `apple-splash-${pxWidth}-${pxHeight}.png`));
}

console.log(`Generated ${devices.length} iOS splash screens in public/splash/`);
