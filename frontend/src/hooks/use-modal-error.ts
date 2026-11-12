import { useEffect } from "react";
import { useTranslations } from "next-intl";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import { applyProblemToForm } from "@/lib/api/problem-details";
import { takeModalError } from "@/lib/modal/modal-error-bus";

/** A failed optimistic save reopened this modal: surface the server error. */
export function useModalError<T extends FieldValues>(
  open: boolean,
  draftKey: string,
  form: UseFormReturn<T>,
) {
  const tAuth = useTranslations("auth");

  useEffect(() => {
    if (!open) return;
    const error = takeModalError(draftKey);
    if (error)
      applyProblemToForm(error, form, undefined, tAuth("errors.checkInput"));
  }, [open, draftKey, form, tAuth]);
}
