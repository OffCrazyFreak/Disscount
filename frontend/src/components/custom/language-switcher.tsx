"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Languages, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { locales, type Locale } from "@/i18n/config";
import { setLocale } from "@/i18n/locale-actions";

// Endonyms (each language named in itself) — the conventional way to list
// languages, so these are intentionally not translated.
const LANGUAGE_NAMES: Record<Locale, string> = {
  hr: "Hrvatski",
  en: "English",
  de: "Deutsch",
  sl: "Slovenščina",
};

interface ILanguageSwitcherProps {
  // "icon": compact icon button for the header/footer.
  // "sidebar": full-width sidebar menu row with an icon + "Language" label.
  variant?: "icon" | "sidebar";
  className?: string;
}

export default function LanguageSwitcher({
  variant = "icon",
  className,
}: ILanguageSwitcherProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(next: string) {
    if (next === locale) return;

    startTransition(async () => {
      await setLocale(next as Locale);
      router.refresh();
    });
  }

  const options = (
    <DropdownMenuRadioGroup value={locale} onValueChange={handleSelect}>
      {locales.map((option) => (
        <DropdownMenuRadioItem key={option} value={option}>
          {LANGUAGE_NAMES[option]}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );

  if (variant === "sidebar") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton disabled={isPending} className={className}>
            <Languages />
            <span>{t("language")}</span>
            <ChevronDown className="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="top" align="start">
          {options}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("language")}
          disabled={isPending}
          className={cn(
            "text-muted-foreground transition-all hover:scale-110 hover:bg-transparent hover:text-primary",
            className,
          )}
        >
          <Languages className="size-5" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">{options}</DropdownMenuContent>
    </DropdownMenu>
  );
}
