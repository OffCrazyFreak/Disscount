import type { CardPhotoSlot } from "@/constants/card-codes";

const FULL_LONG_EDGE = 1280;
const THUMB_LONG_EDGE = 320;
const ICON_SIZE = 128;
const WEBP_QUALITY = 0.75;
const JPEG_QUALITY = 0.78;
// The server refuses a full image over 512 KB; this leaves headroom for multipart framing.
export const MAX_FULL_BYTES = 480 * 1024;

export type CardImageErrorCode =
  "cannotSave" | "cannotProcess" | "cannotOpen" | "tooLarge";

/** The caller translates `code` as `digitalCards.errors.image.<code>`. */
export class CardImageError extends Error {
  constructor(readonly code: CardImageErrorCode) {
    super(code);
  }
}

export interface IPreparedCardImage {
  full: Blob;
  thumb?: Blob;
}

/** Safari silently returns PNG for a webp request, and the server rejects PNG. */
export function needsJpegFallback(blob: Blob | null): boolean {
  return blob?.type !== "image/webp";
}

export interface IEncodeAttempt {
  longEdge: number;
  /** Overrides the default quality for both formats. */
  quality?: number;
}

/** Tried in order until the full image fits the server limit. */
export const FULL_ATTEMPTS: IEncodeAttempt[] = [
  { longEdge: FULL_LONG_EDGE },
  { longEdge: FULL_LONG_EDGE, quality: 0.65 },
  { longEdge: FULL_LONG_EDGE, quality: 0.55 },
  { longEdge: 1024, quality: 0.55 },
];

/** First blob within `limit`, or undefined when even the last attempt is too big. */
export async function firstWithinLimit(
  attempts: IEncodeAttempt[],
  encodeAttempt: (attempt: IEncodeAttempt) => Promise<Blob>,
  limit: number,
): Promise<Blob | undefined> {
  for (const attempt of attempts) {
    const blob = await encodeAttempt(attempt);
    if (blob.size <= limit) return blob;
  }
  return undefined;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, quality),
  );
}

/** JPEG has no alpha, so transparent pixels would encode as black. */
function paintWhiteBehind(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) return;

  context.globalCompositeOperation = "destination-over";
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
}

async function encode(
  canvas: HTMLCanvasElement,
  quality?: number,
): Promise<Blob> {
  const webp = await toBlob(canvas, "image/webp", quality ?? WEBP_QUALITY);
  if (webp && !needsJpegFallback(webp)) return webp;

  paintWhiteBehind(canvas);
  const jpeg = await toBlob(canvas, "image/jpeg", quality ?? JPEG_QUALITY);
  if (!jpeg) throw new CardImageError("cannotSave");
  return jpeg;
}

function draw(
  bitmap: ImageBitmap,
  source: { x: number; y: number; width: number; height: number },
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new CardImageError("cannotProcess");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    bitmap,
    source.x,
    source.y,
    source.width,
    source.height,
    0,
    0,
    width,
    height,
  );
  return canvas;
}

function scaled(bitmap: ImageBitmap, longEdge: number): HTMLCanvasElement {
  // Never upscale: a small photo gains nothing from more pixels.
  const scale = Math.min(1, longEdge / Math.max(bitmap.width, bitmap.height));
  const whole = { x: 0, y: 0, width: bitmap.width, height: bitmap.height };

  return draw(
    bitmap,
    whole,
    Math.max(1, Math.round(bitmap.width * scale)),
    Math.max(1, Math.round(bitmap.height * scale)),
  );
}

function centerCropped(bitmap: ImageBitmap, size: number): HTMLCanvasElement {
  const side = Math.min(bitmap.width, bitmap.height);
  const crop = {
    x: (bitmap.width - side) / 2,
    y: (bitmap.height - side) / 2,
    width: side,
    height: side,
  };
  return draw(bitmap, crop, size, size);
}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new CardImageError("cannotOpen");
  }
}

export async function prepareCardImage(
  file: File,
  slot: CardPhotoSlot,
): Promise<IPreparedCardImage> {
  const bitmap = await decode(file);

  try {
    if (slot === "icon") {
      return { full: await encode(centerCropped(bitmap, ICON_SIZE)) };
    }

    const full = await firstWithinLimit(
      FULL_ATTEMPTS,
      ({ longEdge, quality }) => encode(scaled(bitmap, longEdge), quality),
      MAX_FULL_BYTES,
    );
    if (!full) throw new CardImageError("tooLarge");

    return {
      full,
      thumb: await encode(scaled(bitmap, THUMB_LONG_EDGE)),
    };
  } finally {
    bitmap.close();
  }
}
