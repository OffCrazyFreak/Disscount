// Drawn at twice the CSS size and registered with pixelRatio 2, so logos stay
// sharp on high-density screens.
export const ICON_PIXEL_RATIO = 2;

// 36 CSS px: above WCAG 2.5.8's 24 px target with room for the logo to read.
const ICON_SIZE = 36 * ICON_PIXEL_RATIO;

const BORDER = 2 * ICON_PIXEL_RATIO;

const TILE_RADIUS = 8 * ICON_PIXEL_RATIO;

export function chainIconId(chain: string): string {
  return `chain-${chain}`;
}

export const COUNT_BADGE_ID = "cluster-count-badge";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load ${src}`));
    image.src = src;
  });
}

function createCanvas(size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");

  return context;
}

function circle(context: CanvasRenderingContext2D, size: number) {
  context.beginPath();
  context.arc(size / 2, size / 2, size / 2 - BORDER / 2, 0, Math.PI * 2);
}

function tile(
  context: CanvasRenderingContext2D,
  inset: number,
  radius: number,
) {
  const side = ICON_SIZE - inset * 2;
  context.beginPath();
  context.roundRect(inset, inset, side, side, radius);
}

/**
 * The chain logo as a rounded square tile, the shape the logos are drawn in
 * and the one the landing page shows. The dark rim keeps 3:1 contrast against
 * any basemap colour (WCAG 1.4.11). A logo that fails to load leaves a plain
 * tile rather than a missing marker.
 */
export async function renderChainIcon(chain: string): Promise<ImageData> {
  const context = createCanvas(ICON_SIZE);

  tile(context, BORDER / 2, TILE_RADIUS);
  context.fillStyle = "#ffffff";
  context.fill();

  try {
    const logo = await loadImage(`/store-chains/${chain}.png`);

    context.save();
    tile(context, BORDER, TILE_RADIUS - BORDER / 2);
    context.clip();
    context.drawImage(
      logo,
      BORDER,
      BORDER,
      ICON_SIZE - BORDER * 2,
      ICON_SIZE - BORDER * 2,
    );
    context.restore();
  } catch {
    // The rim alone still marks the spot.
  }

  tile(context, BORDER / 2, TILE_RADIUS);
  context.lineWidth = BORDER;
  context.strokeStyle = "#1f2937";
  context.stroke();

  return context.getImageData(0, 0, ICON_SIZE, ICON_SIZE);
}

/** Dark disc the cluster count is printed on. */
export function renderCountBadge(): ImageData {
  const size = 22 * ICON_PIXEL_RATIO;
  const context = createCanvas(size);

  circle(context, size);
  context.fillStyle = "#111827";
  context.fill();
  context.lineWidth = BORDER;
  context.strokeStyle = "#ffffff";
  context.stroke();

  return context.getImageData(0, 0, size, size);
}
