import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";

const buttonVariants = cva(
  // Disabled state swaps in opaque muted tokens (fill + text) instead of
  // opacity, so the button never lets a busy background bleed through, its
  // label fades too, and every colour variant collapses to the same look.
  "cursor-pointer disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-70 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Semantic colours mirror badge/banner/tooltip (primary + soft, etc.).
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs",
        primarySoft:
          "border border-primary/40 bg-primary/10 text-primary hover:bg-primary/15",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs",
        destructiveSoft:
          "border border-red-200 bg-red-50 text-red-600 hover:bg-red-100",
        warning: "bg-amber-200 text-amber-700 hover:bg-amber-300 shadow-xs",
        warningSoft:
          "border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100",
        info: "bg-blue-500 text-white hover:bg-blue-500/90 shadow-xs",
        infoSoft:
          "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
        outline:
          "outline-2 -outline-offset-2 hover:outline-secondary hover:bg-green-50 hover:text-accent-foreground shadow-sm",
        // Functional-only variants with no colour-scheme equivalent.
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs",
        ghost: "hover:bg-accent/70 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      effect: {
        expandIcon: "group gap-0 relative",
        ringHover:
          "transition-all duration-300 hover:ring-2 hover:ring-primary/90 hover:ring-offset-2",
        shine:
          "before:animate-shine relative overflow-hidden before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%,100%_100%] before:bg-no-repeat before:transition-[background-position_0s_ease]",
        shineHover:
          "relative overflow-hidden before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%,100%_100%] before:bg-[position:200%_0,0_0] before:bg-no-repeat before:transition-[background-position_0s_ease] hover:before:bg-[position:-100%_0,0_0] before:duration-1000",
        gooeyRight:
          "relative z-0 overflow-hidden transition-all duration-500 before:absolute before:inset-0 before:-z-10 before:translate-x-[150%] before:translate-y-[150%] before:scale-[2.5] before:rounded-[100%] before:bg-gradient-to-r from-white/40 before:transition-transform before:duration-1000  hover:before:translate-x-[0%] hover:before:translate-y-[0%]",
        gooeyLeft:
          "relative z-0 overflow-hidden transition-all duration-500 after:absolute after:inset-0 after:-z-10 after:translate-x-[-150%] after:translate-y-[150%] after:scale-[2.5] after:rounded-[100%] after:bg-gradient-to-l from-white/40 after:transition-transform after:duration-1000  hover:after:translate-x-[0%] hover:after:translate-y-[0%]",
        underline:
          "relative !no-underline after:absolute after:bg-primary after:bottom-2 after:h-[1px] after:w-2/3 after:origin-bottom-left after:scale-x-100 hover:after:origin-bottom-right hover:after:scale-x-0 after:transition-transform after:ease-in-out after:duration-300",
        hoverUnderline:
          "relative !no-underline after:absolute after:bg-primary after:bottom-2 after:h-[1px] after:w-2/3 after:origin-bottom-right after:scale-x-0 hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:ease-in-out after:duration-300",
        gradientSlideShow:
          "bg-[size:400%] bg-[linear-gradient(-45deg,var(--chart-1),oklch(0.86_0.14_142),var(--primary),var(--secondary))] animate-gradient-flow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 py-4",
        lg: "h-11 rounded-md px-8 py-6",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

interface LoadingProps {
  loading?: boolean;
  loadingText?: string;
  hideIconOnLoading?: boolean;
  loadingIconPlacement?: "left" | "right";
}

interface IconProps {
  icon: React.ElementType;
  iconPlacement: "left" | "right";
}

interface IconRefProps {
  icon?: never;
  iconPlacement?: undefined;
}

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export type ButtonIconProps = IconProps | IconRefProps;
export type ButtonLoadingProps = LoadingProps;

const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & ButtonIconProps & ButtonLoadingProps
>(
  (
    {
      className,
      variant,
      effect,
      size = "default",
      icon: Icon,
      iconPlacement,
      loading,
      loadingText,
      loadingIconPlacement = "right",
      hideIconOnLoading = true,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    // Outline buttons have a light fill, so the blocks read best in brand green;
    // filled variants (default/destructive) inherit their white foreground.
    const spinnerColor = variant === "outline" ? "" : "text-inherit";

    return (
      <Comp
        className={cn(
          "relative",
          buttonVariants({ variant, effect, size, className }),
        )}
        ref={ref}
        {...props}
        disabled={loading || props.disabled}
      >
        {loading && loadingIconPlacement === "left" && (
          <BlockLoadingSpinner size={18} className={spinnerColor} />
        )}

        {Icon &&
          iconPlacement === "left" &&
          !(hideIconOnLoading && loading) &&
          (effect === "expandIcon" ? (
            <div className="w-0 translate-x-[0%] pr-0 opacity-0 transition-all duration-200 group-hover:w-5 group-hover:-translate-x-1 group-hover:pr-2 group-hover:opacity-100">
              <Icon className="size-5" />
            </div>
          ) : (
            <Icon className="size-5" />
          ))}

        <Slottable>{loading ? loadingText : props.children}</Slottable>

        {loading && loadingIconPlacement === "right" && (
          <BlockLoadingSpinner size={18} className={cn("ml-2", spinnerColor)} />
        )}

        {Icon &&
          iconPlacement === "right" &&
          !(hideIconOnLoading && loading) &&
          (effect === "expandIcon" ? (
            <div className="w-0 relative translate-x-[100%] pl-0 opacity-0 transition-all duration-200 group-hover:w-5 group-hover:translate-x-0 group-hover:pl-2 group-hover:opacity-100">
              <Icon className="size-5" />
            </div>
          ) : (
            <Icon className="size-5" />
          ))}
      </Comp>
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
