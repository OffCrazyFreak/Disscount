// Shared draw-on animation math for the happy cart. librsvg can't play the
// SVG animation, so both the cart and lockup animators rebuild it frame by
// frame from these easings and the per-frame cart group.

// Solves a CSS cubic-bezier easing y for a given progress x (Newton-Raphson).
export function bezier(x1, y1, x2, y2) {
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

export const easeOut = bezier(0, 0, 0.58, 1);
export const pop = bezier(0.34, 1.56, 0.64, 1);
export const seg = (T, start, dur) =>
  Math.min(1, Math.max(0, (T - start) / dur));

export const CART_END = 1.6; // seconds until the last cart element finishes
export const GREEN = "#2ec50d"; // brand green, matches the app's --primary

// Pulls the two animated path strings out of cart-animated.svg.
export function extractPaths(svg) {
  return {
    body: svg.match(/class="cart-body" d="([^"]+)"/)[1],
    eyes: svg.match(/class="cart-eyes" d="([^"]+)"/)[1],
  };
}

// The cart <g> at time T, with draw-on dashoffsets and popping wheels.
export function cartGroup(body, eyes, T) {
  const bodyOff = 140 * (1 - easeOut(seg(T, 0, 1.2)));
  const eyesOff = 12 * (1 - easeOut(seg(T, 1.1, 0.5)));
  const backR = 4.5 * pop(seg(T, 0.9, 0.45));
  const frontR = 4.5 * pop(seg(T, 1.05, 0.45));

  return `<g transform="translate(2.5 0) rotate(-7 23 53.5)"><path d="${body}" stroke-dasharray="140" stroke-dashoffset="${bodyOff.toFixed(2)}"/><path d="${eyes}" stroke-dasharray="12" stroke-dashoffset="${eyesOff.toFixed(2)}"/><circle cx="23" cy="49" r="${backR.toFixed(2)}"/><circle cx="45" cy="49" r="${frontR.toFixed(2)}"/></g>`;
}

// Wraps a cart group in a sized, stroked <svg> at the cart's native viewBox.
export function cartFrameSvg(body, eyes, T, width, color = GREEN) {
  const height = Math.round(width * (50.5 / 68));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="-1 6 68 50.5" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${cartGroup(body, eyes, T)}</svg>`;
}
