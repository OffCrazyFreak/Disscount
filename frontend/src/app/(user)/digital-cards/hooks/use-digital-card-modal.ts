import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { digitalCardService } from "@/lib/api";
import type { DigitalCardDto, DigitalCardRequest } from "@/lib/api/types";
import { stashModalError } from "@/lib/modal/modal-error-bus";
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

    if (!onlineManager.isOnline()) {
      toast.info(
        "Izvan si mreže - promjena će se sinkronizirati kad se vratiš na mrežu.",
      );
    }

    try {
      if (digitalCard) {
        await updateMutation.mutateAsync({ id: digitalCard.id, data });
        toast.success("Digitalna kartica je uspješno ažurirana!");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Digitalna kartica je uspješno kreirana!");
      }

      removeFormDraft(draftKey);
      await queryClient.invalidateQueries({ queryKey: ["digitalCards"] });
    } catch (error) {
      stashModalError(draftKey, error);
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
