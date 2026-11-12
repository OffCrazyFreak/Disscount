import {
  infiniteQueryOptions,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import apiClient from "@/lib/api/api-base";
import { CONTACT_QUERY_KEYS } from "@/lib/api/contact/keys";
import {
  ContactMessageRequest,
  ContactMessageDto,
  ContactMessagePage,
  contactMessageRequestSchema,
  contactMessageDtoSchema,
  contactMessagePageSchema,
} from "@/lib/api/types";

const ADMIN_BASE_PATH = "/api/admin/contact";

const CONTACT_PAGE_SIZE = 50;

async function createContactMessage(
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

async function getContactMessages(
  includeDeleted: boolean,
  page: number,
): Promise<ContactMessagePage> {
  const response = await apiClient.get<unknown>(ADMIN_BASE_PATH, {
    params: { includeDeleted, page, size: CONTACT_PAGE_SIZE },
  });
  return contactMessagePageSchema.parse(response.data);
}

function nextPageNumber({ page }: ContactMessagePage): number | undefined {
  const next = page.number + 1;
  return next < page.totalPages ? next : undefined;
}

// A message sent while the admin scrolls pushes older ones down a page, so the next page can repeat one.
function uniqueMessages(pages: ContactMessagePage[]): ContactMessageDto[] {
  const byId = new Map<string, ContactMessageDto>();

  for (const message of pages.flatMap((page) => page.items)) {
    if (!byId.has(message.id)) byId.set(message.id, message);
  }

  return [...byId.values()];
}

async function patchContactAction(
  id: string,
  action: string,
): Promise<ContactMessageDto> {
  const response = await apiClient.patch<ContactMessageDto>(
    `${ADMIN_BASE_PATH}/${id}/${action}`,
  );
  return contactMessageDtoSchema.parse(response.data);
}

async function softDeleteContactMessage(
  id: string,
): Promise<ContactMessageDto> {
  const response = await apiClient.delete<ContactMessageDto>(
    `${ADMIN_BASE_PATH}/${id}`,
  );
  return contactMessageDtoSchema.parse(response.data);
}

function useCreateContactMessage() {
  return useMutation<ContactMessageDto | null, Error, ContactMessageRequest>({
    mutationFn: createContactMessage,
  });
}

function contactMessagesQueryOptions(includeDeleted: boolean) {
  return infiniteQueryOptions({
    queryKey: CONTACT_QUERY_KEYS.list(includeDeleted),
    queryFn: ({ pageParam }) => getContactMessages(includeDeleted, pageParam),
    initialPageParam: 0,
    getNextPageParam: nextPageNumber,
    select: (data) => uniqueMessages(data.pages),
  });
}

function useGetContactMessages(includeDeleted = false) {
  return useInfiniteQuery(contactMessagesQueryOptions(includeDeleted));
}

function useContactAction(action: (id: string) => Promise<ContactMessageDto>) {
  const queryClient = useQueryClient();

  return useMutation<ContactMessageDto, Error, string>({
    mutationFn: action,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: CONTACT_QUERY_KEYS.all }),
  });
}

function useMarkRead() {
  return useContactAction((id) => patchContactAction(id, "read"));
}

function useMarkUnread() {
  return useContactAction((id) => patchContactAction(id, "unread"));
}

function useSoftDelete() {
  return useContactAction(softDeleteContactMessage);
}

function useRestore() {
  return useContactAction((id) => patchContactAction(id, "restore"));
}

const contactService = {
  useCreateContactMessage,
  useGetContactMessages,
  useMarkRead,
  useMarkUnread,
  useSoftDelete,
  useRestore,
};

export default contactService;
