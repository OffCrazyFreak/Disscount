"use client";

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface ModalShellFooterProps {
  cancelLabel?: string;
  onCancel?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  submitVariant?: "default" | "destructive";
  onSubmit?: () => void;
  // When set, the submit button submits the <form id={formId}> living in the body,
  // so forms don't need to wrap the footer to get native submit behavior.
  formId?: string;
  footerStart?: ReactNode;
  caption?: ReactNode;
}

export function ModalShellFooter({
  cancelLabel,
  onCancel,
  submitLabel,
  submitDisabled,
  submitLoading,
  submitVariant = "default",
  onSubmit,
  formId,
  footerStart,
  caption,
}: ModalShellFooterProps) {
  const hasButtons = !!cancelLabel || !!submitLabel || !!footerStart;

  if (!hasButtons && !caption) return null;

  return (
    <div className="flex flex-col gap-2 px-6 pb-6 pt-4">
      {hasButtons && (
        <div className="flex items-center gap-2">
          {footerStart && (
            <div className="flex min-w-0 items-center gap-2">{footerStart}</div>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-2">
            {cancelLabel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitLoading}
              >
                {cancelLabel}
              </Button>
            )}

            {submitLabel && (
              <Button
                type={formId ? "submit" : "button"}
                form={formId}
                variant={submitVariant}
                onClick={formId ? undefined : onSubmit}
                disabled={submitDisabled || submitLoading}
              >
                {submitLoading && <Loader2 className="animate-spin" />}
                {submitLabel}
              </Button>
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
