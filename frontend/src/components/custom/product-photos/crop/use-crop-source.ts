import { useEffect, useState } from "react";

import { fetchPrivateOriginal } from "@/lib/api/product-images/admin-queries";

type CropSource =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; url: string; width: number; height: number };

async function loadImage(originalUrl: string): Promise<HTMLImageElement> {
  // User originals sit behind the admin check; Open Food Facts allows any origin to read its files.
  const privateOriginal = originalUrl.startsWith("/api/");
  const src = privateOriginal
    ? URL.createObjectURL(await fetchPrivateOriginal(originalUrl))
    : originalUrl;

  const image = new Image();
  if (!privateOriginal) image.crossOrigin = "anonymous";
  image.src = src;
  try {
    await image.decode();
    return image;
  } finally {
    if (privateOriginal) URL.revokeObjectURL(src);
  }
}

async function rotated(
  image: HTMLImageElement,
  rotation: number,
): Promise<Blob> {
  const quarter = rotation === 90 || rotation === 270;
  const canvas = document.createElement("canvas");
  canvas.width = quarter ? image.naturalHeight : image.naturalWidth;
  canvas.height = quarter ? image.naturalWidth : image.naturalHeight;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("No canvas");
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.9),
  );
  if (!blob) throw new Error("No blob");
  return blob;
}

/** Turned the way the server will turn it, so the frame the admin draws lands on the same pixels the server crops. */
export function useCropSource(originalUrl: string, rotation: number) {
  const [source, setSource] = useState<CropSource>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;

    loadImage(originalUrl)
      .then((image) => rotated(image, rotation))
      .then(async (blob) => {
        url = URL.createObjectURL(blob);
        const bitmap = await createImageBitmap(blob);
        const ready = {
          status: "ready" as const,
          url,
          width: bitmap.width,
          height: bitmap.height,
        };
        bitmap.close();
        if (!cancelled) setSource(ready);
      })
      .catch(() => {
        if (!cancelled) setSource({ status: "error" });
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setSource({ status: "loading" });
    };
  }, [originalUrl, rotation]);

  return source;
}
