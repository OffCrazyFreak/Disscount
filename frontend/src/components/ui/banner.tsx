import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Variants stay in sync with badgeVariants (same colour families). size scales
// padding/text/icon: lg = icon+title+text, md = icon+title, sm = text only.
const bannerVariants = cva(
  "flex items-center rounded-lg border [&>svg]:shrink-0 mb-4",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-primary text-white",
        primarySoft: "border-primary/40 bg-primary/10 text-primary",
        destructive: "border-transparent bg-destructive text-white",
        destructiveSoft: "border-red-200 bg-red-50 text-red-600",
        warning: "border-transparent bg-amber-200 text-amber-700",
        warningSoft: "border-amber-200 bg-amber-50 text-amber-600",
        info: "border-transparent bg-blue-500 text-white",
        infoSoft: "border-blue-200 bg-blue-50 text-blue-700",
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

// The title inherits the variant's accent colour above; the paragraph gets a
// darker/muted tone per variant so callers never style the body themselves.
const BANNER_TEXT_COLORS: Record<
  NonNullable<VariantProps<typeof bannerVariants>["variant"]>,
  string
> = {
  primary: "text-white/90",
  primarySoft: "text-primary/90",
  destructive: "text-white/90",
  destructiveSoft: "text-red-700",
  warning: "text-amber-800",
  warningSoft: "text-amber-900",
  info: "text-white/90",
  infoSoft: "text-blue-800",
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
      {Icon && <Icon />}

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
