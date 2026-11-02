import {
  CardImageError,
  decode,
  firstWithinLimit,
  paintWhiteBehind,
  scaled,
  toBlob,
  type IEncodeAttempt,
} from "@/utils/browser/card-image";

// The server keeps at most 2048 px a side and 512 KB; this leaves headroom for multipart framing.
const MAX_BYTES = 480 * 1024;
const JPEG_QUALITY = 0.82;

const ATTEMPTS: IEncodeAttempt[] = [
  { longEdge: 2048 },
  { longEdge: 2048, quality: 0.7 },
  { longEdge: 1600, quality: 0.7 },
  { longEdge: 1280, quality: 0.65 },
];

/** Always JPEG: the server renders product photos from JPEG, and white replaces any transparency. */
export async function prepareProductPhoto(file: File): Promise<Blob> {
  const bitmap = await decode(file);

  try {
    const photo = await firstWithinLimit(
      ATTEMPTS,
      async ({ longEdge, quality }) => {
        const canvas = scaled(bitmap, longEdge);
        paintWhiteBehind(canvas);
        const blob = await toBlob(
          canvas,
          "image/jpeg",
          quality ?? JPEG_QUALITY,
        );
        if (!blob) throw new CardImageError("cannotSave");
        return blob;
      },
      MAX_BYTES,
    );
    if (!photo) throw new CardImageError("tooLarge");
    return photo;
  } finally {
    bitmap.close();
  }
}
