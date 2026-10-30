"use client";

import { type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IModalFooterSubmitButtonProps {
  label: string;
  // Submits the <form id={formId}> natively; onSubmit runs only without one.
  formId?: string;
  onSubmit?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant: "primary" | "destructive";
  icon: LucideIcon;
}

export default function ModalFooterSubmitButton({
  label,
  formId,
  onSubmit,
  disabled,
  loading,
  variant,
  icon,
}: IModalFooterSubmitButtonProps) {
  const enabled = !disabled && !loading;

  return (
    // A brief nudge every 10s while there is something to save.
    <div className={cn(enabled && "animate-submit-nudge")}>
      <Button
        type={formId ? "submit" : "button"}
        form={formId}
        variant={variant}
        icon={icon}
        iconPlacement="left"
        onClick={formId ? undefined : onSubmit}
        disabled={disabled}
        loading={loading}
        loadingIconPlacement="left"
      >
        {label}
      </Button>
    </div>
  );
}
