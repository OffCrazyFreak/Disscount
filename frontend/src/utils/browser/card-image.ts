import type { CardPhotoSlot } from "@/constants/card-codes";

const FULL_LONG_EDGE = 1280;
const THUMB_LONG_EDGE = 320;
const ICON_SIZE = 128;
const WEBP_QUALITY = 0.75;
const JPEG_QUALITY = 0.78;

export interface IPreparedCardImage {
  full: Blob;
  thumb?: Blob;
}

/** Safari silently returns PNG for a webp request, and the server rejects PNG. */
export function needsJpegFallback(blob: Blob | null): boolean {
  return blob?.type !== "image/webp";
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, quality),
  );
}

async function encode(canvas: HTMLCanvasElement): Promise<Blob> {
  const webp = await toBlob(canvas, "image/webp", WEBP_QUALITY);
  if (webp && !needsJpegFallback(webp)) return webp;

  const jpeg = await toBlob(canvas, "image/jpeg", JPEG_QUALITY);
  if (!jpeg) throw new Error("Slika se ne može spremiti u ovom pregledniku.");
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
  if (!context)
    throw new Error("Slika se ne može obraditi u ovom pregledniku.");

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
    throw new Error("Ova se slika ne može otvoriti. Odaberi drugu.");
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

    return {
      full: await encode(scaled(bitmap, FULL_LONG_EDGE)),
      thumb: await encode(scaled(bitmap, THUMB_LONG_EDGE)),
    };
  } finally {
    bitmap.close();
  }
}
