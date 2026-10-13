// Drawn at twice the CSS size and registered with pixelRatio 2, so logos stay
// sharp on high-density screens.
export const ICON_PIXEL_RATIO = 2;

// 40 CSS px: above WCAG 2.5.8's 24 px target with room for the logo to read.
const ICON_SIZE = 40 * ICON_PIXEL_RATIO;

const BORDER = 2 * ICON_PIXEL_RATIO;

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

function circleCanvas(size: number, fill: string, stroke: string) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");

  context.beginPath();
  context.arc(size / 2, size / 2, size / 2 - BORDER / 2, 0, Math.PI * 2);
  context.fillStyle = fill;
  context.fill();
  context.lineWidth = BORDER;
  context.strokeStyle = stroke;
  context.stroke();

  return { canvas, context };
}

/**
 * The chain logo inside a white disc with a dark rim, so it keeps 3:1 contrast
 * against any basemap colour (WCAG 1.4.11). A logo that fails to load becomes
 * a plain disc rather than a missing marker.
 */
export async function renderChainIcon(chain: string): Promise<ImageData> {
  const { context } = circleCanvas(ICON_SIZE, "#ffffff", "#1f2937");

  try {
    const logo = await loadImage(`/store-chains/${chain}.png`);
    const inner = ICON_SIZE * 0.68;
    const scale = Math.min(inner / logo.width, inner / logo.height);
    const width = logo.width * scale;
    const height = logo.height * scale;

    context.drawImage(
      logo,
      (ICON_SIZE - width) / 2,
      (ICON_SIZE - height) / 2,
      width,
      height,
    );
  } catch {
    // The rim alone still marks the spot.
  }

  return context.getImageData(0, 0, ICON_SIZE, ICON_SIZE);
}

/** Dark disc the cluster count is printed on. */
export function renderCountBadge(): ImageData {
  const size = 22 * ICON_PIXEL_RATIO;
  const { context } = circleCanvas(size, "#111827", "#ffffff");

  return context.getImageData(0, 0, size, size);
}
