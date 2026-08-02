import * as React from "react";

import { cn } from "@/lib/utils";

interface IInputProps extends Omit<React.ComponentProps<"input">, "size"> {
  size?: "default" | "lg";
}

function Input({ className, type, size = "default", ...props }: IInputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(
        // The default height is a plain utility so tailwind-merge can strip it
        // when a caller passes its own. As data-[size=default]:h-10 it outranked
        // any consumer class on specificity while merge treated the two as
        // unrelated keys, so the class was emitted, kept, and still lost.
        "file:text-foreground placeholder:text-placeholder selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-10 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-[size=lg]:h-11 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
