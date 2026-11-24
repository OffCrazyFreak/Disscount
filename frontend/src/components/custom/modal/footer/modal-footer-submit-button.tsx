"use client";

import { useEffect } from "react";
import { type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IModalFooterSubmitButtonProps {
  label: string;
  // Submits the <form id={formId}> natively; onSubmit runs only without one.
  formId?: string;
  onSubmit?: () => void;
  disabled?: boolean;
  /** Missing or invalid fields: the tap still submits, so the form shows every error and moves to the first. */
  incomplete?: boolean;
  loading?: boolean;
  variant: "primary" | "destructive";
  icon: LucideIcon;
}

export default function ModalFooterSubmitButton({
  label,
  formId,
  onSubmit,
  disabled,
  incomplete,
  loading,
  variant,
  icon,
}: IModalFooterSubmitButtonProps) {
  const enabled = !disabled && !incomplete && !loading;

  useRevealFirstInvalidField(formId, incomplete && !disabled);

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
        // aria-disabled, not disabled, because a disabled button swallows the tap that should explain it.
        aria-disabled={(incomplete && !disabled) || undefined}
        className={cn(incomplete && "opacity-50 shadow-none")}
        loading={loading}
        loadingIconPlacement="left"
      >
        {label}
      </Button>
    </div>
  );
}

/** After the form's own validation has run and focused what it can, also scrolls to the first invalid field. */
function useRevealFirstInvalidField(
  formId: string | undefined,
  active: boolean | undefined,
) {
  useEffect(() => {
    const form = formId ? document.getElementById(formId) : null;
    if (!active || !(form instanceof HTMLFormElement)) return;

    function reveal() {
      // react-hook-form sets aria-invalid and focuses in a later task, so wait for both.
      window.setTimeout(() => {
        requestAnimationFrame(() => {
          const field = form?.querySelector<HTMLElement>(
            '[aria-invalid="true"]',
          );
          if (!field) return;

          if (document.activeElement !== field) field.focus();

          const reduce = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          field.scrollIntoView({
            block: "center",
            behavior: reduce ? "auto" : "smooth",
          });
        });
      });
    }

    form.addEventListener("submit", reveal);

    return () => form.removeEventListener("submit", reveal);
  }, [formId, active]);
}
