"use client";

import { ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

import ModalFooterActions from "@/components/custom/modal/modal-footer-actions";

export interface IModalShellFooterProps {
  cancelLabel?: string;
  onCancel?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  submitVariant?: "primary" | "destructive";
  submitIcon?: LucideIcon;
  onSubmit?: () => void;
  // Submit targets the <form id={formId}> in the body; reset only does too when no onReset.
  formId?: string;
  resetLabel?: string;
  onReset?: () => void;
  resetDisabled?: boolean;
  // Extra actions rendered next to Odustani (e.g. a destructive "Ukloni").
  footerStart?: ReactNode;
  caption?: ReactNode;
}

/**
 * Whether the composed footer would render anything. Exported so ModalShell can
 * decide about its wrapper without a second copy of this condition.
 */
export function hasFooterContent(props: IModalShellFooterProps): boolean {
  return Boolean(
    props.cancelLabel ||
    props.resetLabel ||
    props.submitLabel ||
    props.footerStart ||
    props.caption,
  );
}

export function ModalShellFooter({
  caption,
  ...actions
}: IModalShellFooterProps) {
  const hasButtons = hasFooterContent(actions);

  if (!hasButtons && !caption) return null;

  return (
    <div className="flex flex-col gap-2 px-6 pb-6 pt-4">
      {hasButtons && <ModalFooterActions {...actions} />}

      {caption && (
        <p className="text-center text-xs text-muted-foreground">{caption}</p>
      )}
    </div>
  );
}
