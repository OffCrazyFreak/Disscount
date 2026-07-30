import apiClient from "@/lib/api/api-base";
import { DigitalCardRequest, DigitalCardDto } from "@/lib/api/types";

export async function createDigitalCard(
  data: DigitalCardRequest,
): Promise<DigitalCardDto> {
  const response = await apiClient.post<DigitalCardDto>(
    "/api/digital-cards",
    data,
  );
  return response.data;
}

export async function getCurrentUserDigitalCards(): Promise<DigitalCardDto[]> {
  const response = await apiClient.get<DigitalCardDto[]>(
    "/api/digital-cards/me",
  );
  return response.data;
}

export async function updateDigitalCard(
  id: string,
  data: DigitalCardRequest,
): Promise<DigitalCardDto> {
  const response = await apiClient.put<DigitalCardDto>(
    `/api/digital-cards/${id}`,
    data,
  );
  return response.data;
}

export async function deleteDigitalCard(id: string): Promise<void> {
  await apiClient.delete(`/api/digital-cards/${id}`);
}

// One function over two endpoints: pinning must not ship the card's images back, which
// a full PUT would, so the backend keeps them as separate verbs.
export async function setDigitalCardPinned(
  id: string,
  pinned: boolean,
): Promise<DigitalCardDto> {
  const response = await apiClient.patch<DigitalCardDto>(
    `/api/digital-cards/${id}/${pinned ? "pin" : "unpin"}`,
  );
  return response.data;
}
