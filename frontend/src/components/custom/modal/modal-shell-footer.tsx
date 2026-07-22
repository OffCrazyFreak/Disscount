"use client";

import { ReactNode } from "react";
import { RotateCcw, Save, X, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ModalShellFooterProps {
  cancelLabel?: string;
  onCancel?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  submitVariant?: "primary" | "destructive";
  submitIcon?: LucideIcon;
  onSubmit?: () => void;
  // When set, the submit button submits the <form id={formId}> living in the
  // body; the reset button becomes a native type="reset" for the same form.
  formId?: string;
  resetLabel?: string;
  onReset?: () => void;
  resetDisabled?: boolean;
  // Extra actions rendered next to Odustani (e.g. a destructive "Ukloni").
  footerStart?: ReactNode;
  caption?: ReactNode;
}

export function ModalShellFooter({
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
  caption,
}: ModalShellFooterProps) {
  const hasButtons = !!cancelLabel || !!submitLabel || !!footerStart;

  if (!hasButtons && !caption) return null;

  const submitEnabled = !submitDisabled && !submitLoading;

  return (
    <div className="flex flex-col gap-2 px-6 pb-6 pt-4">
      {hasButtons && (
        <div className="flex items-center gap-2">
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
              // Hidden on mobile: not enough horizontal room next to cancel + submit.
              <Button
                type={formId && !onReset ? "reset" : "button"}
                form={formId && !onReset ? formId : undefined}
                variant="outline"
                icon={RotateCcw}
                iconPlacement="left"
                onClick={onReset}
                disabled={resetDisabled || submitLoading}
                className="hidden sm:inline-flex"
              >
                {resetLabel}
              </Button>
            )}

            {submitLabel && (
              // A brief nudge once every 10s (CSS keyframe) while there is
              // something to save, drawing the eye without being distracting.
              <div className={cn(submitEnabled && "animate-submit-nudge")}>
                <Button
                  type={formId ? "submit" : "button"}
                  form={formId}
                  variant={submitVariant}
                  icon={submitIcon}
                  iconPlacement="left"
                  onClick={formId ? undefined : onSubmit}
                  disabled={submitDisabled}
                  loading={submitLoading}
                  loadingIconPlacement="left"
                >
                  {submitLabel}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {caption && (
        <p className="text-center text-xs text-muted-foreground">{caption}</p>
      )}
    </div>
  );
}
