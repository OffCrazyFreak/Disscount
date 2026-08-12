import {
  hexForHue,
  hueFromHex,
} from "@/app/(user)/digital-cards/utils/card-colors";

const SAMPLE_SIZE = 48;

/**
 * Best-effort dominant hue of an image, used to prefill a card's colour from its logo or
 * photo. Returns null rather than guessing badly, and the caller keeps the current colour.
 *
 * Near-white, near-black and washed-out pixels are skipped: a card photo is mostly plastic
 * whitespace, and letting that win would make every suggestion grey.
 */
export default async function extractDominantColor(
  source: Blob | string,
): Promise<string | null> {
  let bitmap: ImageBitmap | null = null;

  try {
    // A data URI is the already-downscaled WebP the compressor produced, so sampling it
    // avoids decoding a multi-megapixel original a second time.
    const blob =
      typeof source === "string" ? await (await fetch(source)).blob() : source;

    bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;

    context.drawImage(bitmap, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

    const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const buckets = new Map<number, number>();
    const centre = SAMPLE_SIZE / 2;

    for (let index = 0; index < data.length; index += 4) {
      const [r, g, b, alpha] = [
        data[index],
        data[index + 1],
        data[index + 2],
        data[index + 3],
      ];
      if (alpha < 200) continue;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max > 240 || max < 24 || max - min < 28) continue;

      const hex = `#${[r, g, b]
        .map((channel) => channel.toString(16).padStart(2, "0"))
        .join("")}`;
      const { hue, isNeutral } = hueFromHex(hex);
      if (isNeutral) continue;

      // Weight the middle of the frame, where a logo usually sits.
      const pixel = index / 4;
      const x = pixel % SAMPLE_SIZE;
      const y = Math.floor(pixel / SAMPLE_SIZE);
      const distance = Math.hypot(x - centre, y - centre) / centre;
      const weight = 1 + (1 - Math.min(distance, 1));

      // 15 degree buckets, so one gradient does not split across many hues.
      const bucket = Math.round(hue / 15) % 24;
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + weight);
    }

    if (buckets.size === 0) return null;

    const [dominant] = [...buckets.entries()].sort((a, b) => b[1] - a[1])[0];

    // Snap onto the card palette's fixed saturation and lightness, so an extracted colour
    // is indistinguishable from a picked one and still passes contrast.
    return hexForHue(dominant * 15);
  } catch {
    return null;
  } finally {
    // Drawing and getImageData can both throw, and an unclosed bitmap holds its decoded
    // pixels until GC gets round to it.
    bitmap?.close();
  }
}
