import type { CardPhotoSlot } from "@/constants/card-codes";
import {
  centerCropped,
  decode,
  encodeWebpOrJpeg,
  firstWithinLimit,
  ImageProcessingError,
  scaled,
  type IEncodeAttempt,
} from "@/utils/browser/image";

// Enough pixels that a barcode or card number photographed at arm's length stays readable.
const FULL_LONG_EDGE = 1280;
const THUMB_LONG_EDGE = 320;
const ICON_SIZE = 128;
const WEBP_QUALITY = 0.75;
const JPEG_QUALITY = 0.78;
// The server refuses a full image over 512 KB; this leaves headroom for multipart framing.
const MAX_FULL_BYTES = 480 * 1024;

export interface IPreparedCardImage {
  full: Blob;
  thumb?: Blob;
}

/** Tried in order until the full image fits the server limit. */
const FULL_ATTEMPTS: IEncodeAttempt[] = [
  { longEdge: FULL_LONG_EDGE },
  { longEdge: FULL_LONG_EDGE, quality: 0.65 },
  { longEdge: FULL_LONG_EDGE, quality: 0.55 },
  { longEdge: 1024, quality: 0.55 },
];

function encode(canvas: HTMLCanvasElement, quality?: number): Promise<Blob> {
  return encodeWebpOrJpeg(canvas, {
    webp: quality ?? WEBP_QUALITY,
    jpeg: quality ?? JPEG_QUALITY,
  });
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
    if (!full) throw new ImageProcessingError("tooLarge");

    return {
      full,
      thumb: await encode(scaled(bitmap, THUMB_LONG_EDGE)),
    };
  } finally {
    bitmap.close();
  }
}
