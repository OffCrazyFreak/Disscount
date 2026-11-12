"use client";

import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface IModalFooterResetButtonProps {
  label: string;
  // Resets the <form id={formId}> natively only when no onReset handler is given.
  formId?: string;
  onReset?: () => void;
  disabled: boolean;
}

export default function ModalFooterResetButton({
  label,
  formId,
  onReset,
  disabled,
}: IModalFooterResetButtonProps) {
  const resetsForm = Boolean(formId && !onReset);

  return (
    // Icon-only on mobile so it fits next to cancel + submit; labelled from sm up.
    <Button
      type={resetsForm ? "reset" : "button"}
      form={resetsForm ? formId : undefined}
      variant="outline"
      size="icon"
      icon={RotateCcw}
      iconPlacement="left"
      onClick={onReset}
      disabled={disabled}
      aria-label={label}
      labelFrom="sm"
    >
      {label}
    </Button>
  );
}
