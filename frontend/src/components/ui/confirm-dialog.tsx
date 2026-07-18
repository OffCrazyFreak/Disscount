"use client";

import {
  AlertTriangle,
  LogOut,
  Loader2,
  Check,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

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
  variant = "default",
  icon,
  confirmIcon,
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const reduceMotion = useReducedMotion();
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
      hero={
        <motion.div
          initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 20 }}
          className="relative flex size-14 items-center justify-center"
        >
          {/* Concentric halo rings that ground the icon and set the tone. */}
          <span
            className={cn(
              "absolute inset-0 rounded-full",
              isDestructive ? "bg-destructive/10" : "bg-amber-500/10"
            )}
          />
          <span
            className={cn(
              "absolute inset-1.5 rounded-full",
              isDestructive ? "bg-destructive/15" : "bg-amber-500/15"
            )}
          />
          <Icon
            className={cn(
              "relative size-6",
              isDestructive ? "text-destructive" : "text-amber-600"
            )}
            strokeWidth={2.2}
          />
        </motion.div>
      }
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
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : confirmLabel}
          </Button>
        </div>
      }
    />
  );
}
