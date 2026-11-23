import apiClient from "@/lib/api/api-base";
import {
  ContactMessageRequest,
  ContactMessageDto,
  contactMessageRequestSchema,
  contactMessageDtoSchema,
} from "@/lib/api/types";

const ADMIN_BASE_PATH = "/api/admin/contact";

export async function createContactMessage(
  data: ContactMessageRequest,
): Promise<ContactMessageDto | null> {
  const validated = contactMessageRequestSchema.parse(data);
  const response = await apiClient.post<ContactMessageDto>(
    "/api/contact",
    validated,
  );

  // The backend drops a honeypot-filled submission and answers 204 with no body, so a bot cannot tell it was caught.
  if (response.status === 204) return null;

  return contactMessageDtoSchema.parse(response.data);
}

export async function getContactMessages(
  includeDeleted = false,
): Promise<ContactMessageDto[]> {
  const response = await apiClient.get<ContactMessageDto[]>(ADMIN_BASE_PATH, {
    params: { includeDeleted },
  });
  return response.data.map((item) => contactMessageDtoSchema.parse(item));
}

export async function patchContactAction(
  id: string,
  action: string,
): Promise<ContactMessageDto> {
  const response = await apiClient.patch<ContactMessageDto>(
    `${ADMIN_BASE_PATH}/${id}/${action}`,
  );
  return contactMessageDtoSchema.parse(response.data);
}

export async function softDeleteContactMessage(
  id: string,
): Promise<ContactMessageDto> {
  const response = await apiClient.delete<ContactMessageDto>(
    `${ADMIN_BASE_PATH}/${id}`,
  );
  return contactMessageDtoSchema.parse(response.data);
}
