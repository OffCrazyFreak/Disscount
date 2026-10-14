"use client";

import {
  AlertTriangle,
  LogOut,
  Check,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";

import { ModalShell } from "@/components/custom/modal/modal-shell";
import { Button } from "@/components/ui/button";
import ConfirmDialogHero from "@/components/custom/modal/confirm-dialog-hero";

interface IConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "destructive";
  icon?: LucideIcon;
  confirmIcon?: LucideIcon;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = "Potvrdi",
  cancelLabel = "Odustani",
  variant = "primary",
  icon,
  confirmIcon,
  onConfirm,
  isLoading = false,
}: IConfirmDialogProps) {
  const isDestructive = variant === "destructive";
  const Icon = icon ?? (isDestructive ? AlertTriangle : LogOut);
  const ConfirmIcon = confirmIcon ?? (isDestructive ? Trash2 : Check);

  return (
    <ModalShell
      open={isOpen}
      onOpenChange={onOpenChange}
      size="sm"
      centered
      preventClose={isLoading}
      title={title}
      description={description}
      // Enter confirms only when the action is reversible. ModalShell focuses the
      // dialog container rather than a control, so nothing looks armed, and every
      // destructive caller here deletes an account or a list. Two ordinary Enter
      // presses, one to open and one on the still-unfocused dialog, would run it.
      onSubmit={isDestructive ? undefined : onConfirm}
      submitLoading={isLoading}
      hero={<ConfirmDialogHero icon={Icon} isDestructive={isDestructive} />}
      footer={
        <div className="flex items-center justify-between gap-2 px-6 pb-6 pt-3">
          <Button
            variant="outline"
            icon={X}
            iconPlacement="left"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>

          <Button
            variant={variant}
            icon={ConfirmIcon}
            iconPlacement="left"
            loading={isLoading}
            loadingIconPlacement="left"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    />
  );
}
