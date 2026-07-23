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
        primarySoft: "border-primary/40 bg-primary/10 text-primary",
        destructive: "border-transparent bg-destructive text-white",
        destructiveSoft:
          "border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
        warning: "border-transparent bg-amber-200 text-amber-700",
        warningSoft:
          "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
        info: "border-transparent bg-blue-500 text-white",
        infoSoft:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
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
          <p
            className={cn("text-xs", BANNER_TEXT_COLORS[variant ?? "primary"])}
          >
            {text}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}

export { Banner, bannerVariants };
