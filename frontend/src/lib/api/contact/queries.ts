import apiClient from "@/lib/api/api-base";
import {
  ContactMessageRequest,
  ContactMessageDto,
  contactMessageRequestSchema,
  contactMessageDtoSchema,
} from "@/lib/api/types";

const ADMIN_BASE_PATH = "/api/admin/contact";

/** Public: no auth header is sent when logged out. */
export async function createContactMessage(
  data: ContactMessageRequest,
): Promise<ContactMessageDto> {
  const validated = contactMessageRequestSchema.parse(data);
  const response = await apiClient.post<ContactMessageDto>(
    "/api/contact",
    validated,
  );
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

export async function getContactMessage(
  id: string,
): Promise<ContactMessageDto> {
  const response = await apiClient.get<ContactMessageDto>(
    `${ADMIN_BASE_PATH}/${id}`,
  );
  return contactMessageDtoSchema.parse(response.data);
}

/** read/unread, archive/unarchive and restore all share the patch shape. */
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
