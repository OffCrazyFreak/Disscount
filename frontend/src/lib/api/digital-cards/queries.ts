import apiClient from "@/lib/api/api-base";
import {
  digitalCardDtoSchema,
  digitalCardRequestSchema,
  digitalCardsConfigSchema,
  type DigitalCardDto,
  type DigitalCardRequest,
  type DigitalCardsConfig,
} from "@/lib/api/types";

const CARDS_PATH = "/api/digital-cards";

export async function getMyDigitalCards(): Promise<DigitalCardDto[]> {
  const response = await apiClient.get<unknown[]>(`${CARDS_PATH}/me`);
  return response.data.map((item) => digitalCardDtoSchema.parse(item));
}

export async function getDigitalCardsConfig(): Promise<DigitalCardsConfig> {
  const response = await apiClient.get<unknown>(`${CARDS_PATH}/config`);
  return digitalCardsConfigSchema.parse(response.data);
}

/** Idempotent upsert: the client mints the id, so a replayed create is harmless. */
export async function saveDigitalCard(
  id: string,
  data: DigitalCardRequest,
): Promise<DigitalCardDto> {
  const response = await apiClient.put<unknown>(
    `${CARDS_PATH}/${id}`,
    digitalCardRequestSchema.parse(data),
  );
  return digitalCardDtoSchema.parse(response.data);
}

export async function deleteDigitalCard(id: string): Promise<void> {
  await apiClient.delete(`${CARDS_PATH}/${id}`);
}

export async function setDigitalCardPinned(
  id: string,
  pinned: boolean,
): Promise<void> {
  await apiClient.put(`${CARDS_PATH}/${id}/pin`, { pinned });
}

export async function setDigitalCardArchived(
  id: string,
  archived: boolean,
): Promise<void> {
  await apiClient.put(`${CARDS_PATH}/${id}/archive`, { archived });
}

export async function postCardsUsed(
  entries: { id: string; usedAt: string }[],
): Promise<void> {
  await apiClient.post(`${CARDS_PATH}/used`, entries);
}
