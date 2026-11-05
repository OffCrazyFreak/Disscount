import { DirectoryStoreDto } from "@/lib/api/schemas";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { getFormDraft, setFormDraft } from "@/utils/browser/local-storage";
import { getChainLabel, getLocationLabel } from "@/utils/labels";

interface ILocationReportCopy {
  subject: string;
  /** Builds the message from the store's name and its chain:code id. */
  message: (store: string, id: string) => string;
}

// The contact modal's own draft key: it restores a saved draft when it opens,
// which is how the report arrives prefilled without a new endpoint.
const CONTACT_DRAFT_KEY = "contact";

/** Opens the contact form with the store already named in the message. */
export function openLocationReport(
  store: DirectoryStoreDto,
  copy: ILocationReportCopy,
) {
  const hasDraft =
    Object.keys(getFormDraft(CONTACT_DRAFT_KEY)?.values ?? {}).length > 0;

  // A half-written message of the user's own is never overwritten.
  if (!hasDraft) {
    const place = [store.address, getLocationLabel(store.city)]
      .filter(Boolean)
      .join(", ");

    setFormDraft(CONTACT_DRAFT_KEY, {
      subject: copy.subject,
      message: copy.message(
        `${getChainLabel(store.chain)}, ${place}`,
        `${store.chain}:${store.code}`,
      ),
    });
  }

  openModalUrl({ name: "contact" });
}
