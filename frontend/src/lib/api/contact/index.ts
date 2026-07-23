import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api/api-base";
import {
  ContactMessageRequest,
  ContactMessageDto,
  contactMessageRequestSchema,
  contactMessageDtoSchema,
} from "@/lib/api/types";

const ADMIN_BASE_PATH = "/api/admin/contact";

const CONTACT_QUERY_KEYS = {
  all: ["admin", "contact"] as const,
  list: (includeDeleted: boolean) =>
    ["admin", "contact", { includeDeleted }] as const,
  detail: (id: string) => ["admin", "contact", "detail", id] as const,
};

// Public: submit a contact message (no auth header sent when logged out).
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

// Admin reads
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

// Admin state changes: read/unread, archive/unarchive, restore share the patch shape.
async function patchContactAction(
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

// React Query hooks
export function useCreateContactMessage() {
  return useMutation<ContactMessageDto, Error, ContactMessageRequest>({
    mutationFn: createContactMessage,
  });
}

export function useGetContactMessages(
  includeDeleted = false,
  { enabled = true } = {},
) {
  return useQuery<ContactMessageDto[], Error>({
    queryKey: CONTACT_QUERY_KEYS.list(includeDeleted),
    queryFn: () => getContactMessages(includeDeleted),
    enabled,
  });
}

export function useGetContactMessage(id: string, { enabled = true } = {}) {
  return useQuery<ContactMessageDto, Error>({
    queryKey: CONTACT_QUERY_KEYS.detail(id),
    queryFn: () => getContactMessage(id),
    enabled,
  });
}

function useContactAction(action: (id: string) => Promise<ContactMessageDto>) {
  const queryClient = useQueryClient();

  return useMutation<ContactMessageDto, Error, string>({
    mutationFn: action,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: CONTACT_QUERY_KEYS.all }),
  });
}

export function useMarkRead() {
  return useContactAction((id) => patchContactAction(id, "read"));
}

export function useMarkUnread() {
  return useContactAction((id) => patchContactAction(id, "unread"));
}

export function useSoftDelete() {
  return useContactAction(softDeleteContactMessage);
}

export function useRestore() {
  return useContactAction((id) => patchContactAction(id, "restore"));
}

const contactService = {
  createContactMessage,
  getContactMessages,
  getContactMessage,
  useCreateContactMessage,
  useGetContactMessages,
  useGetContactMessage,
  useMarkRead,
  useMarkUnread,
  useSoftDelete,
  useRestore,
};

export default contactService;
