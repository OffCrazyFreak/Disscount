"use client";

import { Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import ModalFooterResetButton from "@/components/custom/modal/modal-footer-reset-button";
import ModalFooterSubmitButton from "@/components/custom/modal/modal-footer-submit-button";
import type { IModalShellFooterProps } from "@/components/custom/modal/modal-shell-footer";

type IModalFooterActionsProps = Omit<IModalShellFooterProps, "caption">;

export default function ModalFooterActions({
  cancelLabel,
  onCancel,
  submitLabel,
  submitDisabled,
  submitLoading,
  submitVariant = "primary",
  submitIcon = Save,
  onSubmit,
  formId,
  resetLabel,
  onReset,
  resetDisabled,
  footerStart,
}: IModalFooterActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {cancelLabel && (
        <Button
          type="button"
          variant="outline"
          icon={X}
          iconPlacement="left"
          onClick={onCancel}
          disabled={submitLoading}
        >
          {cancelLabel}
        </Button>
      )}

      {footerStart}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {resetLabel && (
          <ModalFooterResetButton
            label={resetLabel}
            formId={formId}
            onReset={onReset}
            disabled={Boolean(resetDisabled || submitLoading)}
          />
        )}

        {submitLabel && (
          <ModalFooterSubmitButton
            label={submitLabel}
            formId={formId}
            onSubmit={onSubmit}
            disabled={submitDisabled}
            loading={submitLoading}
            variant={submitVariant}
            icon={submitIcon}
          />
        )}
      </div>
    </div>
  );
}
