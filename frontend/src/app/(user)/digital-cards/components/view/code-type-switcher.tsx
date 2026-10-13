"use client";

import { Save, Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CODE_TYPE_LABELS, type CodeType } from "@/constants/card-codes";

interface ICodeTypeSwitcherProps {
  shownType: CodeType;
  savedType: CodeType;
  canSwitch: boolean;
  isSaving: boolean;
  onNext: () => void;
  onSave: () => void;
}

export default function CodeTypeSwitcher({
  shownType,
  savedType,
  canSwitch,
  isSaving,
  onNext,
  onSave,
}: ICodeTypeSwitcherProps) {
  if (!canSwitch && shownType === savedType) return null;

  return (
    <div className="flex flex-col gap-2">
      <p aria-live="polite" className="text-sm text-muted-foreground">
        Prikazano kao: {CODE_TYPE_LABELS[shownType]}
      </p>

      <div className="flex flex-wrap gap-2">
        {canSwitch && (
          <Button
            variant="outline"
            size="sm"
            icon={Shuffle}
            iconPlacement="left"
            onClick={onNext}
          >
            Ne skenira se? Probaj drugi tip
          </Button>
        )}

        {shownType !== savedType && (
          <Button
            variant="primarySoft"
            size="sm"
            icon={Save}
            iconPlacement="left"
            loading={isSaving}
            onClick={onSave}
          >
            Spremi kao zadano
          </Button>
        )}
      </div>
    </div>
  );
}
