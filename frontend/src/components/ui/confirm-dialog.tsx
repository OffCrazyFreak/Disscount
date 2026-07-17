"use client";

import { AlertTriangle, LogOut, Loader2 } from "lucide-react";

import { ModalShell } from "@/components/ui/modal-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
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
  variant = "default",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const Icon = variant === "destructive" ? AlertTriangle : LogOut;

  return (
    <ModalShell
      open={isOpen}
      onOpenChange={onOpenChange}
      size="sm"
      centered
      preventClose={isLoading}
      title={title}
      description={description}
      hero={
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full",
            variant === "destructive"
              ? "bg-destructive/10 text-destructive"
              : "bg-amber-50 text-amber-600"
          )}
        >
          <Icon size={20} strokeWidth={2} />
        </div>
      }
      footer={
        <div className="flex gap-2 px-6 pb-6 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>

          <Button
            variant={variant}
            className="flex-1"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      }
    />
  );
}
