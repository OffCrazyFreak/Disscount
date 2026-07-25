"use client";

import BottomSheet from "@/components/custom/bottom-sheet/bottom-sheet";
import installInstructionSteps from "@/components/custom/pwa/install-instruction-steps";

interface IInstallInstructionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isIOS: boolean;
}

export default function InstallInstructionsSheet({
  open,
  onOpenChange,
  isIOS,
}: IInstallInstructionsSheetProps) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Dodaj na početni zaslon"
      description="Dodaj Disscount na početni zaslon u nekoliko koraka."
      srOnlyDescription={false}
      showCloseButton
    >
      <ol className="flex flex-col gap-4">
        {installInstructionSteps(isIOS).map((step, index) => (
          <li key={index} className="flex items-center gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
              {index + 1}
            </span>

            <span>{step}</span>
          </li>
        ))}
      </ol>
    </BottomSheet>
  );
}
