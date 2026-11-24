"use client";

import { ChevronUp, Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useChangeLocale } from "@/components/custom/locale/use-change-locale";
import { isLocale, LOCALE_NAMES, LOCALES } from "@/i18n/locales";
import { cn } from "@/lib/utils";

interface ILanguageSwitcherProps {
  variant?: "icon" | "sidebar";
  className?: string;
}

export default function LanguageSwitcher({
  variant = "icon",
  className,
}: ILanguageSwitcherProps) {
  const t = useTranslations("locale");
  const locale = useLocale();
  const { changeLocale, isPending } = useChangeLocale();

  function handleChange(value: string) {
    if (isLocale(value) && value !== locale) changeLocale(value);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isPending}>
        {variant === "sidebar" ? (
          <SidebarMenuButton className={className}>
            <Languages aria-hidden="true" />
            <span>{t("label")}</span>
            <span lang={locale} className="ml-auto text-muted-foreground">
              {LOCALE_NAMES[locale]}
            </span>
            <ChevronUp aria-hidden="true" />
          </SidebarMenuButton>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("change")}
            className={cn("text-muted-foreground", className)}
          >
            <Languages aria-hidden="true" />
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={variant === "sidebar" ? "top" : "bottom"}
        align="end"
      >
        <DropdownMenuRadioGroup value={locale} onValueChange={handleChange}>
          {LOCALES.map((option) => (
            <DropdownMenuRadioItem key={option} value={option} lang={option}>
              {LOCALE_NAMES[option]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
