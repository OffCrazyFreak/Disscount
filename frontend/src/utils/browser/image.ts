export type ImageErrorCode =
  "cannotSave" | "cannotProcess" | "cannotOpen" | "tooLarge";

/** Each upload translates `code` with its own message keys. */
export class ImageProcessingError extends Error {
  constructor(readonly code: ImageErrorCode) {
    super(code);
  }
}

export interface IEncodeAttempt {
  longEdge: number;
  /** Overrides the default quality for both formats. */
  quality?: number;
}

export interface IEncodeQuality {
  webp: number;
  jpeg: number;
}

/** Safari silently returns PNG for a webp request, and the server rejects PNG. */
export function needsJpegFallback(blob: Blob | null): boolean {
  return blob?.type !== "image/webp";
}

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

/** Re-encoding from a canvas is also what drops EXIF, GPS and any embedded thumbnail. */
export async function encodeJpeg(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  paintWhiteBehind(canvas);
  const jpeg = await toBlob(canvas, "image/jpeg", quality);
  if (!jpeg) throw new ImageProcessingError("cannotSave");
  return jpeg;
}

export async function encodeWebpOrJpeg(
  canvas: HTMLCanvasElement,
  quality: IEncodeQuality,
): Promise<Blob> {
  const webp = await toBlob(canvas, "image/webp", quality.webp);
  if (webp && !needsJpegFallback(webp)) return webp;

  return encodeJpeg(canvas, quality.jpeg);
}

interface IRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

function draw(
  bitmap: ImageBitmap,
  source: IRegion,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new ImageProcessingError("cannotProcess");

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

export function scaled(
  bitmap: ImageBitmap,
  longEdge: number,
): HTMLCanvasElement {
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

export function centerCropped(
  bitmap: ImageBitmap,
  size: number,
): HTMLCanvasElement {
  const side = Math.min(bitmap.width, bitmap.height);
  const crop = {
    x: (bitmap.width - side) / 2,
    y: (bitmap.height - side) / 2,
    width: side,
    height: side,
  };
  return draw(bitmap, crop, size, size);
}

/** Applies the EXIF rotation, so a phone photo is upright once its metadata is gone. */
export async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new ImageProcessingError("cannotOpen");
  }
}
