import { centerCropped, decode, encodeWebpOrJpeg } from "@/utils/browser/image";

// Shown at most 96 CSS px, so 256 stays sharp on a 2x screen; square because the frame is round.
const AVATAR_SIZE = 256;
const QUALITY = { webp: 0.8, jpeg: 0.8 };

export async function prepareAvatar(file: File): Promise<Blob> {
  const bitmap = await decode(file);

  try {
    return await encodeWebpOrJpeg(centerCropped(bitmap, AVATAR_SIZE), QUALITY);
  } finally {
    bitmap.close();
  }
}
