import apiClient from "@/lib/api/api-base";
import type { CardPhotoSlot } from "@/constants/card-codes";
import { cardPhotoDtoSchema, type CardPhotoDto } from "@/lib/api/types";

export type CardPhotoSize = "full" | "thumb";

export async function uploadCardPhoto(
  cardId: string,
  slot: CardPhotoSlot,
  full: Blob,
  thumb?: Blob,
): Promise<CardPhotoDto> {
  const body = new FormData();
  body.append("full", full, `${slot}.${extensionFor(full)}`);
  if (thumb)
    body.append("thumb", thumb, `${slot}-thumb.${extensionFor(thumb)}`);

  const response = await apiClient.put<unknown>(
    `/api/digital-cards/${cardId}/photos/${slot}`,
    body,
    // Unset so the browser writes the multipart boundary itself.
    { headers: { "Content-Type": undefined } },
  );
  return cardPhotoDtoSchema.parse(response.data);
}

export async function deleteCardPhoto(
  cardId: string,
  slot: CardPhotoSlot,
): Promise<void> {
  await apiClient.delete(`/api/digital-cards/${cardId}/photos/${slot}`);
}

/** Through apiClient because an <img src> cannot carry the bearer token. */
export async function fetchCardPhotoBlob(
  cardId: string,
  slot: CardPhotoSlot,
  size: CardPhotoSize,
  sha256: string,
): Promise<Blob> {
  const response = await apiClient.get<Blob>(
    `/api/digital-cards/${cardId}/photos/${slot}`,
    { params: { size, v: sha256 }, responseType: "blob" },
  );
  return response.data;
}

function extensionFor(blob: Blob): string {
  return blob.type === "image/jpeg" ? "jpg" : "webp";
}
