import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { digitalCardService } from "@/lib/api";
import type { DigitalCardDto, DigitalCardRequest } from "@/lib/api/types";
import { stashModalError } from "@/lib/modal/modal-error-bus";
import { stashModalValues } from "@/lib/modal/modal-retry-bus";
import { closeModalUrl, openModalUrl } from "@/lib/modal/modal-navigation";
import { removeFormDraft } from "@/utils/browser/local-storage";

interface IUseDigitalCardModalProps {
  digitalCard?: DigitalCardDto | null;
  draftKey: string;
}

export function useDigitalCardModal({
  digitalCard,
  draftKey,
}: IUseDigitalCardModalProps) {
  const queryClient = useQueryClient();

  const createMutation = digitalCardService.useCreateDigitalCard();
  const updateMutation = digitalCardService.useUpdateDigitalCard();

  // Optimistic close: the modal closes immediately and reopens only on failure.
  async function onSubmit(data: DigitalCardRequest) {
    closeModalUrl();

    // A paused mutation resolves only on reconnect, so say so now.
    if (!onlineManager.isOnline()) {
      toast.info(
        "Izvan si mreže - promjena će se sinkronizirati kad se vratiš na mrežu.",
      );
    }

    try {
      if (digitalCard) {
        await updateMutation.mutateAsync({ id: digitalCard.id, data });
        toast.success("Kartica je uspješno ažurirana!");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Kartica je uspješno dodana!");
      }

      removeFormDraft(draftKey);
      await queryClient.invalidateQueries({ queryKey: ["digitalCards"] });
    } catch (error) {
      stashModalError(draftKey, error);
      // The code is excluded from the draft, so without this the retry would come back
      // empty and silently resubmit the old server value. Memory only, never disk.
      stashModalValues(draftKey, { codeValue: data.codeValue });
      openModalUrl(
        digitalCard
          ? { name: "digital-card", action: "edit", id: digitalCard.id }
          : { name: "digital-card", action: "new" },
      );
    }
  }

  return {
    onSubmit,
    isLoading: createMutation.isPending || updateMutation.isPending,
  };
}
