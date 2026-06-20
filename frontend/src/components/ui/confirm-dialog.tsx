"use client";

import { AlertTriangle, LogOut, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open={isOpen} onOpenChange={isLoading ? undefined : onOpenChange}>
      <DialogContent showCloseButton={!isLoading} className="max-w-sm">
        <DialogHeader className="items-center text-center gap-3">
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

          <div className="space-y-1">
            <DialogTitle className="text-base leading-snug">{title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="flex-row gap-2 pt-1">
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
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
