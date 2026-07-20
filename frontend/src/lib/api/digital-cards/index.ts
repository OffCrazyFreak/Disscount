import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api/api-base";
import {
  DigitalCardRequest,
  DigitalCardDto,
  digitalCardRequestSchema,
  digitalCardDtoSchema,
} from "@/lib/api/types";

/**
 * Create a new digital card
 */
export async function createDigitalCard(
  data: DigitalCardRequest,
): Promise<DigitalCardDto> {
  const validatedData = digitalCardRequestSchema.parse(data);

  const response = await apiClient.post<DigitalCardDto>(
    "/api/digital-cards",
    validatedData,
  );

  return digitalCardDtoSchema.parse(response.data);
}

/**
 * Get all digital cards for current user
 */
export async function getUserDigitalCards(): Promise<DigitalCardDto[]> {
  const response = await apiClient.get<DigitalCardDto[]>(
    "/api/digital-cards/me",
  );

  return response.data.map((item) => digitalCardDtoSchema.parse(item));
}

/**
 * Update digital card
 */
export async function updateDigitalCard(
  id: string,
  data: DigitalCardRequest,
): Promise<DigitalCardDto> {
  const validatedData = digitalCardRequestSchema.parse(data);

  const response = await apiClient.put<DigitalCardDto>(
    `/api/digital-cards/${id}`,
    validatedData,
  );

  return digitalCardDtoSchema.parse(response.data);
}

/**
 * Delete digital card
 */
export async function deleteDigitalCard(id: string): Promise<void> {
  await apiClient.delete(`/api/digital-cards/${id}`);
}

// React Query hooks
export const useCreateDigitalCard = () => {
  return useMutation<DigitalCardDto, Error, DigitalCardRequest>({
    mutationFn: createDigitalCard,
  });
};

export const useGetUserDigitalCards = ({ enabled = true } = {}) => {
  return useQuery<DigitalCardDto[], Error>({
    queryKey: ["digitalCards", "me"],
    queryFn: getUserDigitalCards,
    enabled,
  });
};

export const useUpdateDigitalCard = () => {
  return useMutation<
    DigitalCardDto,
    Error,
    { id: string; data: DigitalCardRequest }
  >({
    mutationFn: ({ id, data }) => updateDigitalCard(id, data),
  });
};

export const useDeleteDigitalCard = () => {
  return useMutation<void, Error, string>({
    mutationFn: deleteDigitalCard,
  });
};

const digitalCardService = {
  createDigitalCard,
  getUserDigitalCards,
  updateDigitalCard,
  deleteDigitalCard,
  // React Query hooks
  useCreateDigitalCard,
  useGetUserDigitalCards,
  useUpdateDigitalCard,
  useDeleteDigitalCard,
};

export default digitalCardService;
