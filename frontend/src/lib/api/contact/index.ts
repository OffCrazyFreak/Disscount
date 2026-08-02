import * as queries from "@/lib/api/contact/queries";
import * as hooks from "@/lib/api/contact/hooks";
import { CONTACT_QUERY_KEYS } from "@/lib/api/contact/keys";

export * from "@/lib/api/contact/queries";
export * from "@/lib/api/contact/hooks";
export { CONTACT_QUERY_KEYS };

const contactService = {
  ...queries,
  ...hooks,
  QUERY_KEYS: CONTACT_QUERY_KEYS,
};

export default contactService;
