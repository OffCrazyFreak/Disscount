import {
  useCreateContactMessage,
  useGetContactMessages,
  useMarkRead,
  useMarkUnread,
  useRestore,
  useSoftDelete,
} from "@/lib/api/contact/hooks";

const contactService = {
  useCreateContactMessage,
  useGetContactMessages,
  useMarkRead,
  useMarkUnread,
  useSoftDelete,
  useRestore,
};

export default contactService;
