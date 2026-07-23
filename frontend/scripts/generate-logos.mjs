// One generator for the whole logo matrix. Run from the frontend dir:
//   node scripts/generate-logos.mjs
// Produces the 4 marks (cart, wordmark, horizontal lockup, vertical lockup) in
// two colour variants (-rgb brand green, -white), each as SVG + PNG + WebP +
// animated GIF + animated WebP, into per-mark subfolders under
// public/brand/logo (cart/, wordmark/, lockup-horizontal/, lockup-vertical/).
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { renderCart, ROOT } from "./lib/cart-source.mjs";
import {
  easeOut,
  seg,
  cartFrameSvg,
  extractPaths,
} from "./lib/cart-frames.mjs";

const LOGO = path.join(ROOT, "public/brand/logo");
const MARKS = ["lockup-horizontal", "lockup-vertical", "wordmark", "cart"];

// Route each file into its per-mark subfolder (brand/logo/<mark>/<file>).
function markFile(filename) {
  const mark = MARKS.find((m) => filename.startsWith(`${m}-`));
  return path.join(LOGO, mark, filename);
}

const WM_SRC = markFile("wordmark-rgb.png");
const FPS = 25;
const HOLD = 1500; // ms lingering on the finished frame before looping

const GREEN = [46, 197, 13]; // #2ec50d, the app's --primary
const VARIANTS = [
  { n: "rgb", rgb: GREEN, hex: "#2ec50d", gifMatte: "#ffffff" },
  { n: "white", rgb: [255, 255, 255], hex: "#ffffff", gifMatte: null },
];

// Lockup layouts (canvas + cart box + wordmark box, in viewBox units).
const H = {
  canvas: [1234, 200],
  cart: [0, 0, 269, 200],
  wm: [309, 21, 925, 158],
};
const V = {
  canvas: [878, 406],
  cart: [291, 0, 296, 220],
  wm: [0, 256, 878, 150],
};
const CART_G = `<g transform="translate(2.5 0) rotate(-7 23 53.5)"><path d="M4.5 8.5c2.4-.3 4.8-.4 7.2-.2l1 .1 5.8 27.4c.2 1.2 1.3 2 2.5 2h27.3c1.1 0 2.1-.7 2.4-1.8l6.6-20.6c.4-1.3-.6-2.7-2-2.7l-36.5-.85"/><path d="M24.5 22.3c2.5-3.1 5.2-3.2 8-.3M38.5 22.1c2.2-2.8 4.7-2.9 7.2-.4"/><circle cx="23" cy="49" r="4.5"/><circle cx="45" cy="49" r="4.5"/></g>`;

const stroke = (hex, extra = "") =>
  `fill="none" stroke="${hex}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"${extra}`;
const cartTag = (hex, x, y, w, h) =>
  `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="-1 6 68 50.5" ${stroke(hex)}>${CART_G}</svg>`;

// Force every pixel's RGB to the variant colour (alpha carries the shape).
// Single-colour marks composite/resize through premultiplied space, which
// overshoots the hue at anti-aliased edges; flooding the RGB kills that fringe.
async function flood(buffer, rgb) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    [data[i], data[i + 1], data[i + 2]] = rgb;
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

function svgBox([cw, ch], rw, inner) {
  const rh = Math.round((rw * ch) / cw);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${rw}" height="${rh}" viewBox="0 0 ${cw} ${ch}" fill="none">${inner}</svg>`;
}
function wmImg(href, [x, y, w, h], T, start, dur) {
  const op = easeOut(seg(T, start, dur));
  return `<image xlink:href="${href}" x="${x}" y="${y}" width="${w}" height="${h}" opacity="${op.toFixed(3)}" transform="translate(0 ${((1 - op) * 14).toFixed(1)})"/>`;
}
function cartInner([x, y, w, h], T, hex, body, eyes) {
  const g = cartFrameSvg(body, eyes, T, w, hex).match(/<g[\s\S]*<\/g>/)[0];
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="-1 6 68 50.5" ${stroke(hex)}>${g}</svg>`;
}

async function frames(build, rw, end, matte) {
  const count = Math.round(end * FPS) + 1;
  const times = Array.from({ length: count }, (_, i) => i / FPS);
  const delay = times.map((_, i) => (i === count - 1 ? HOLD : 1000 / FPS));
  const buffers = await Promise.all(
    times.map((T) => {
      const img = sharp(Buffer.from(build(T, rw)));
      return (matte ? img.flatten({ background: matte }) : img)
        .png()
        .toBuffer();
    }),
  );
  return { buffers, delay };
}

async function animate(name, build, gifW, webpW, end, matte) {
  const gif = await frames(build, gifW, end, matte);
  await sharp(gif.buffers, { join: { animated: true } })
    .gif({ delay: gif.delay, loop: 0, colours: 64, effort: 10 })
    .toFile(markFile(`${name}-animated.gif`));

  const webp = await frames(build, webpW, end, null);
  await sharp(webp.buffers, { join: { animated: true } })
    .withIccProfile("srgb")
    .webp({ delay: webp.delay, loop: 0, quality: 90, effort: 5 })
    .toFile(markFile(`${name}-animated.webp`));
}

// Tag rasters as sRGB so wide-gamut viewers colour-manage them like the SVG
// (an untagged PNG gets treated as device-native and over-saturates the green).
async function stillSet(name, png, svg) {
  await sharp(png)
    .withIccProfile("srgb")
    .png()
    .toFile(markFile(`${name}.png`));
  await sharp(png)
    .withIccProfile("srgb")
    .webp({ lossless: true })
    .toFile(markFile(`${name}.webp`));
  await writeFile(markFile(`${name}.svg`), svg);
}

for (const m of MARKS) await mkdir(path.join(LOGO, m), { recursive: true });
const animSvg = await readFile(markFile("cart-rgb-animated.svg"), "utf8");
const { body, eyes } = extractPaths(animSvg);
const wmGreen = await flood(await readFile(WM_SRC), GREEN);
await writeFile(WM_SRC, wmGreen); // keep the source hue-clean

for (const { n, rgb, hex, gifMatte } of VARIANTS) {
  const wmBuf = await flood(wmGreen, rgb);
  const href = `data:image/png;base64,${wmBuf.toString("base64")}`;

  // Cart: static svg + animated svg.
  await writeFile(
    markFile(`cart-${n}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 6 68 50.5" ${stroke(hex)}>\n  ${CART_G}\n</svg>\n`,
  );
  await writeFile(
    markFile(`cart-${n}-animated.svg`),
    animSvg.replaceAll("#2ec50d", hex),
  );

  // Cart raster.
  const cartPng = await flood(await renderCart(1024), rgb);
  await stillSet(
    `cart-${n}`,
    cartPng,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 6 68 50.5" ${stroke(hex)}>${CART_G}</svg>`,
  );

  // Wordmark raster + svg.
  await stillSet(
    `wordmark-${n}`,
    wmBuf,
    svgBox(
      [1938, 331],
      1938,
      `<image xlink:href="${href}" width="1938" height="331"/>`,
    ),
  );

  // Lockups: composite the flooded cart + wordmark, then flood the result.
  for (const [name, spec] of [
    ["lockup-horizontal", H],
    ["lockup-vertical", V],
  ]) {
    const [cw, ch] = spec.canvas;
    const [cx, cy, ccw, cch] = spec.cart;
    const [wx, wy, ww, wh] = spec.wm;
    const cart = await flood(await renderCart(ccw), rgb);
    const wmR = await sharp(wmBuf).resize(ww, wh).png().toBuffer();
    const composed = await sharp({
      create: {
        width: cw,
        height: ch,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        { input: cart, left: cx, top: cy },
        { input: wmR, left: wx, top: wy },
      ])
      .png()
      .toBuffer();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${cw} ${ch}" fill="none">${cartTag(hex, cx, cy, ccw, cch)}<image xlink:href="${href}" x="${wx}" y="${wy}" width="${ww}" height="${wh}"/></svg>`;
    await stillSet(`${name}-${n}`, await flood(composed, rgb), svg);
  }

  // Animated: cart / wordmark / lockups.
  const builds = {
    [`cart-${n}`]: [
      (T, rw) => cartFrameSvg(body, eyes, T, rw, hex),
      480,
      512,
      1.6,
    ],
    [`wordmark-${n}`]: [
      (T, rw) =>
        svgBox([1938, 331], rw, wmImg(href, [0, 0, 1938, 331], T, 0, 0.9)),
      760,
      900,
      1.0,
    ],
    [`lockup-horizontal-${n}`]: [
      (T, rw) =>
        svgBox(
          H.canvas,
          rw,
          cartInner(H.cart, T, hex, body, eyes) +
            wmImg(href, H.wm, T, 1.2, 0.6),
        ),
      760,
      960,
      2.0,
    ],
    [`lockup-vertical-${n}`]: [
      (T, rw) =>
        svgBox(
          V.canvas,
          rw,
          cartInner(V.cart, T, hex, body, eyes) +
            wmImg(href, V.wm, T, 1.3, 0.6),
        ),
      560,
      720,
      2.0,
    ],
  };
  for (const [name, [build, gifW, webpW, end]] of Object.entries(builds)) {
    await animate(name, build, gifW, webpW, end, gifMatte);
  }
}

console.log(
  "Generated cart / wordmark / lockup logos in -rgb and -white (svg, png, webp, animated gif+webp).",
);
