import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ContactMessageRequest, ContactMessageDto } from "@/lib/api/types";
import { CONTACT_QUERY_KEYS } from "@/lib/api/contact/keys";
import {
  createContactMessage,
  getContactMessage,
  getContactMessages,
  patchContactAction,
  softDeleteContactMessage,
} from "@/lib/api/contact/queries";

export function useCreateContactMessage() {
  return useMutation<ContactMessageDto, Error, ContactMessageRequest>({
    mutationFn: createContactMessage,
  });
}

export const contactQueries = {
  list: (includeDeleted = false) =>
    queryOptions({
      queryKey: CONTACT_QUERY_KEYS.list(includeDeleted),
      queryFn: () => getContactMessages(includeDeleted),
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: CONTACT_QUERY_KEYS.detail(id),
      queryFn: () => getContactMessage(id),
      enabled: !!id,
    }),
};

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
