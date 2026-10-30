"use client";

import { Save, Shuffle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { CODE_TYPE_LABEL_KEYS, type CodeType } from "@/constants/card-codes";

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
  const t = useTranslations("digitalCards");
  const tAll = useTranslations();
  if (!canSwitch && shownType === savedType) return null;

  return (
    <div className="flex flex-col gap-2">
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {t("view.switcher.shownAs", {
          type: tAll(CODE_TYPE_LABEL_KEYS[shownType]),
        })}
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
            {t("view.switcher.tryOther")}
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
            {t("view.switcher.saveDefault")}
          </Button>
        )}
      </div>
    </div>
  );
}
