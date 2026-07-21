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

const LOGO_RATIO = 0.35; // logo occupies ~35% of the shorter edge

const devices = JSON.parse(
  await readFile(path.join(ROOT, "src/constants/ios-splash-screens.json"), "utf8"),
);

await mkdir(OUT, { recursive: true });

for (const device of devices) {
  const pxWidth = device.width * device.ratio;
  const pxHeight = device.height * device.ratio;
  const logoSize = Math.round(Math.min(pxWidth, pxHeight) * LOGO_RATIO);

  const logo = await renderCart(logoSize);

  await sharp({
    create: { width: pxWidth, height: pxHeight, channels: 4, background: BACKGROUND },
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(path.join(OUT, `apple-splash-${pxWidth}-${pxHeight}.png`));
}

console.log(`Generated ${devices.length} iOS splash screens in public/splash/`);
