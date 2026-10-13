import { DirectoryStoreDto } from "@/lib/api/schemas";
import { openModalUrl } from "@/lib/modal/modal-navigation";
import { getFormDraft, setFormDraft } from "@/utils/browser/local-storage";
import { getChainLabel, getLocationLabel } from "@/utils/labels";

// The contact modal's own draft key: it restores a saved draft when it opens,
// which is how the report arrives prefilled without a new endpoint.
const CONTACT_DRAFT_KEY = "contact";

/** Opens the contact form with the store already named in the message. */
export function openLocationReport(store: DirectoryStoreDto) {
  const hasDraft =
    Object.keys(getFormDraft(CONTACT_DRAFT_KEY)?.values ?? {}).length > 0;

  // A half-written message of the user's own is never overwritten.
  if (!hasDraft) {
    const place = [store.address, getLocationLabel(store.city)]
      .filter(Boolean)
      .join(", ");

    setFormDraft(CONTACT_DRAFT_KEY, {
      subject: "Pogrešna lokacija trgovine",
      message: `Trgovina: ${getChainLabel(store.chain)}, ${place} (${store.chain}:${store.code})\n\nŠto nije u redu: `,
    });
  }

  openModalUrl({ name: "contact" });
}
