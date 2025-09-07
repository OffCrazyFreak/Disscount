import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "../api-base";
import {
  DigitalCardRequest,
  DigitalCardDto,
  digitalCardRequestSchema,
  digitalCardDtoSchema,
} from "../types";

/**
 * Create a new digital card
 */
export const createDigitalCard = async (
  data: DigitalCardRequest
): Promise<DigitalCardDto> => {
  const validatedData = digitalCardRequestSchema.parse(data);

  const response = await apiClient.post<DigitalCardDto>(
    "/api/digital-cards",
    validatedData
  );

  return digitalCardDtoSchema.parse(response.data);
};

/**
 * Get all digital cards for current user
 */
export const getUserDigitalCards = async (): Promise<DigitalCardDto[]> => {
  const response = await apiClient.get<DigitalCardDto[]>(
    "/api/digital-cards/me"
  );

  return response.data.map((item) => digitalCardDtoSchema.parse(item));
};

/**
 * Get digital card by ID
 */
export const getDigitalCardById = async (
  id: string
): Promise<DigitalCardDto> => {
  const response = await apiClient.get<DigitalCardDto>(
    `/api/digital-cards/${id}`
  );

  return digitalCardDtoSchema.parse(response.data);
};

/**
 * Update digital card
 */
export const updateDigitalCard = async (
  id: string,
  data: DigitalCardRequest
): Promise<DigitalCardDto> => {
  const validatedData = digitalCardRequestSchema.parse(data);

  const response = await apiClient.put<DigitalCardDto>(
    `/api/digital-cards/${id}`,
    validatedData
  );

  return digitalCardDtoSchema.parse(response.data);
};

/**
 * Delete digital card
 */
export const deleteDigitalCard = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/digital-cards/${id}`);
};

// React Query hooks
export const useCreateDigitalCard = () => {
  return useMutation<DigitalCardDto, Error, DigitalCardRequest>({
    mutationFn: createDigitalCard,
  });
};

export const useGetUserDigitalCards = () => {
  return useQuery<DigitalCardDto[], Error>({
    queryKey: ["digitalCards", "me"],
    queryFn: getUserDigitalCards,
  });
};

export const useGetDigitalCardById = (id: string) => {
  return useQuery<DigitalCardDto, Error>({
    queryKey: ["digitalCards", id],
    queryFn: () => getDigitalCardById(id),
    enabled: !!id,
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
  getDigitalCardById,
  updateDigitalCard,
  deleteDigitalCard,
  // React Query hooks
  useCreateDigitalCard,
  useGetUserDigitalCards,
  useGetDigitalCardById,
  useUpdateDigitalCard,
  useDeleteDigitalCard,
};

export default digitalCardService;
