// One-off animated rasterizer for the happy-cart doodle. Run from frontend dir:
//   node scripts/generate-cart-doodle-animated.mjs
// Rebuilds the SVG draw-on animation frame by frame (librsvg can't play it),
// then stitches an animated GIF (white matte) + animated WebP (transparent).
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SRC = "public/doodle-cart-happy.svg";
const OUT = "public/doodle-cart-happy";

const ASPECT = 50.5 / 68;
const FPS = 25;
const END = 1.6; // seconds, when the last element finishes drawing
const HOLD = 1500; // ms to linger on the finished cart before looping
const GIF_BG = "#ffffff"; // set null for a transparent (fringe-prone) GIF

// Solves a CSS cubic-bezier easing y for a given progress x (Newton-Raphson).
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1,
    bx = 3 * (x2 - x1) - cx,
    ax = 1 - cx - bx;
  const cy = 3 * y1,
    by = 3 * (y2 - y1) - cy,
    ay = 1 - cy - by;
  const fx = (t) => ((ax * t + bx) * t + cx) * t;

  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const dx = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(dx) < 1e-6) break;
      t = Math.min(1, Math.max(0, t - (fx(t) - x) / dx));
    }
    return ((ay * t + by) * t + cy) * t;
  };
}

const easeOut = bezier(0, 0, 0.58, 1);
const pop = bezier(0.34, 1.56, 0.64, 1);
const seg = (T, start, dur) => Math.min(1, Math.max(0, (T - start) / dur));

function frameSvg(body, eyes, T, width) {
  const height = Math.round(width * ASPECT);
  const bodyOff = 140 * (1 - easeOut(seg(T, 0, 1.2)));
  const eyesOff = 12 * (1 - easeOut(seg(T, 1.1, 0.5)));
  const backR = 4.5 * pop(seg(T, 0.9, 0.45));
  const frontR = 4.5 * pop(seg(T, 1.05, 0.45));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="-1 6 68 50.5" fill="none" stroke="#3ecc3e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(2.5 0) rotate(-7 23 53.5)"><path d="${body}" stroke-dasharray="140" stroke-dashoffset="${bodyOff.toFixed(2)}"/><path d="${eyes}" stroke-dasharray="12" stroke-dashoffset="${eyesOff.toFixed(2)}"/><circle cx="23" cy="49" r="${backR.toFixed(2)}"/><circle cx="45" cy="49" r="${frontR.toFixed(2)}"/></g></svg>`;
}

async function renderFrames(body, eyes, times, width, background) {
  return Promise.all(
    times.map((T) => {
      const img = sharp(Buffer.from(frameSvg(body, eyes, T, width)));
      return (background ? img.flatten({ background }) : img).png().toBuffer();
    }),
  );
}

const svg = await readFile(SRC, "utf8");
const body = svg.match(/class="cart-body" d="([^"]+)"/)[1];
const eyes = svg.match(/class="cart-eyes" d="([^"]+)"/)[1];
await mkdir(OUT, { recursive: true });

const count = Math.round(END * FPS) + 1;
const times = Array.from({ length: count }, (_, i) => i / FPS);
const delay = times.map((_, i) => (i === count - 1 ? HOLD : 1000 / FPS));

const gifFrames = await renderFrames(body, eyes, times, 480, GIF_BG);
await sharp(gifFrames, { join: { animated: true } })
  .gif({ delay, loop: 0, colours: 64, effort: 10 })
  .toFile(path.join(OUT, "cart-animated.gif"));

const webpFrames = await renderFrames(body, eyes, times, 512, null);
await sharp(webpFrames, { join: { animated: true } })
  .webp({ delay, loop: 0, lossless: true, effort: 6 })
  .toFile(path.join(OUT, "cart-animated.webp"));

console.log(`Generated animated cart doodle (GIF + WebP) in ${OUT}/`);
