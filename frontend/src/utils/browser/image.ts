import { fileToBase64 } from "@/utils/browser/file";

// Rejects on input the browser can't decode, so callers can explain why.
export default async function resizeImageToWebp(
  file: File,
  maxSize = 256,
  quality = 0.8,
): Promise<string> {
  const bitmap = await createImageBitmap(file);

  try {
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context unavailable");

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    if (!blob) throw new Error("WebP encoding failed");

    return fileToBase64(blob);
  } finally {
    bitmap.close();
  }
}
