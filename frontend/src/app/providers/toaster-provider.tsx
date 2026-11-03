"use client";

import { useTranslations } from "next-intl";
import { Toaster } from "sonner";
import type { CSSProperties, ReactNode } from "react";

interface IToasterProviderProps {
  children: ReactNode;
}

// sonner paints toasts from its own white and grey palette; its variables are
// read off the toaster element, so pointing them at the theme tokens here makes
// every toast follow the brand surface and font.
const TOASTER_THEME_STYLE = {
  "--normal-bg": "var(--popover)",
  "--normal-text": "var(--foreground)",
  "--normal-border": "var(--border)",
  "--border-radius": "var(--radius)",
  fontFamily: "var(--font-sans)",
} as CSSProperties;

// The `!` is required: sonner's button rules are unlayered CSS, which outranks
// any Tailwind utility layer, so a plain class would never apply.
const TOAST_CLASS_NAMES = {
  actionButton:
    "bg-primary! text-primary-foreground! hover:bg-primary/90! focus-visible:ring-2! focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  cancelButton:
    "border! border-primary/40! bg-primary/10! text-foreground! hover:bg-primary/15! focus-visible:ring-2! focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
};

export default function ToasterProvider({ children }: IToasterProviderProps) {
  const t = useTranslations("ui");

  return (
    <>
      {children}

      {/* Both offsets, because sonner only applies mobileOffset under 600px while
          the bar runs to 768px. The token is 0 above md, so desktop keeps a plain
          inset without sonner needing a breakpoint of its own. */}
      <Toaster
        richColors
        containerAriaLabel={t("toaster.label")}
        position="bottom-right"
        offset={{ bottom: "calc(var(--bottom-nav-total) + 0.5rem)" }}
        mobileOffset={{ bottom: "calc(var(--bottom-nav-total) + 0.5rem)" }}
        style={TOASTER_THEME_STYLE}
        toastOptions={{ classNames: TOAST_CLASS_NAMES }}
      />
    </>
  );
}
