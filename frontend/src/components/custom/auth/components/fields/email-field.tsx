import { useTranslations } from "next-intl";
import type { UseFormRegisterReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useValidationMessage } from "@/i18n/use-validation-message";

interface IEmailFieldProps {
  registration: UseFormRegisterReturn;
  error?: string;
  id?: string;
}

export default function EmailField({
  registration,
  error,
  id = "email",
}: IEmailFieldProps) {
  const t = useTranslations("auth");
  const translate = useValidationMessage();

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{t("email.label")}</Label>
      <Input
        id={id}
        type="email"
        placeholder={t("email.placeholder")}
        autoComplete="email"
        {...registration}
        className={cn(error && "border-red-700")}
      />
      {error && <p className="text-sm text-red-700">{translate(error)}</p>}
    </div>
  );
}
