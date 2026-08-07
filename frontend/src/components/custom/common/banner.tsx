import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Variants track badgeVariants; size scales padding/text/icon and sets the intended
// content: lg = icon+title+text, md = icon+title, sm = text only.
const bannerVariants = cva(
  "flex items-center rounded-lg border [&>svg]:shrink-0 mb-4",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-primary text-white",
        // The soft variants tint whatever they sit on rather than covering it, so they take
        // the header's backdrop-blur treatment. Alpha fills also mean one value works in
        // both themes, which is why they no longer carry dark: background overrides; only
        // the text keeps one, since contrast has to be chosen per theme.
        primarySoft:
          "border-primary/40 bg-primary/10 text-primary backdrop-blur-sm",
        destructive: "border-transparent bg-destructive text-white",
        destructiveSoft:
          "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300 backdrop-blur-sm",
        warning: "border-transparent bg-amber-200 text-amber-700",
        warningSoft:
          "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 backdrop-blur-sm",
        info: "border-transparent bg-blue-500 text-white",
        infoSoft:
          "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 backdrop-blur-sm",
        outline: "text-foreground",
      },
      size: {
        sm: "gap-2 p-2 text-xs [&>svg]:size-4",
        md: "gap-3 p-2.5 text-sm [&>svg]:size-6",
        lg: "gap-4 p-3 text-sm [&>svg]:size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

// Per-variant body tone, so callers never style the paragraph themselves.
const BANNER_TEXT_COLORS: Record<
  NonNullable<VariantProps<typeof bannerVariants>["variant"]>,
  string
> = {
  primary: "text-white/90",
  primarySoft: "text-primary/90",
  destructive: "text-white/90",
  destructiveSoft: "text-red-700 dark:text-red-300/90",
  warning: "text-amber-800",
  warningSoft: "text-amber-900 dark:text-amber-200/90",
  info: "text-white/90",
  infoSoft: "text-blue-800 dark:text-blue-300/90",
  outline: "text-muted-foreground",
};

interface IBannerProps
  extends React.ComponentProps<"div">, VariantProps<typeof bannerVariants> {
  icon?: React.ElementType;
  title?: string;
  text?: string;
}

function Banner({
  className,
  variant,
  size,
  icon: Icon,
  title,
  text,
  children,
  ...props
}: IBannerProps) {
  return (
    <div
      data-slot="banner"
      className={cn(bannerVariants({ variant, size }), className)}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" />}

      <div className="min-w-0 space-y-0.5">
        {title && <h4 className="font-bold">{title}</h4>}
        {text && (
          // No size of its own: the size variant already sets one on the container, and a
          // hardcoded text-xs here quietly overrode it, so every banner rendered its body
          // at the smallest size no matter which size was asked for.
          <p className={cn(BANNER_TEXT_COLORS[variant ?? "primary"])}>{text}</p>
        )}
        {children}
      </div>
    </div>
  );
}

export { Banner, bannerVariants };
