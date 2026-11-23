import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { CONTACT_QUERY_KEYS } from "@/lib/api/contact/keys";
import {
  createContactMessage,
  getContactMessages,
  patchContactAction,
  softDeleteContactMessage,
} from "@/lib/api/contact/queries";
import { ContactMessageRequest, ContactMessageDto } from "@/lib/api/types";

export function useCreateContactMessage() {
  return useMutation<ContactMessageDto | null, Error, ContactMessageRequest>({
    mutationFn: createContactMessage,
  });
}

function contactMessagesQueryOptions(includeDeleted: boolean) {
  return queryOptions({
    queryKey: CONTACT_QUERY_KEYS.list(includeDeleted),
    queryFn: () => getContactMessages(includeDeleted),
  });
}

export function useGetContactMessages(
  includeDeleted = false,
  { enabled = true } = {},
) {
  return useQuery({ ...contactMessagesQueryOptions(includeDeleted), enabled });
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
