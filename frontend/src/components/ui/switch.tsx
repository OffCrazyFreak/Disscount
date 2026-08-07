"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Colour means on, and only on: a grey track with a pale thumb, or a green track
        // with the same pale thumb. Tinting the thumb when off reads as active at a glance,
        // which is the opposite of what it means, so the track alone carries the state.
        //
        // Off used to be bg-input on --background, 1.8% apart in lightness with a
        // transparent border, which is why it was invisible. --border is 8% off the
        // background and is what the rest of the primitives outline themselves with.
        // Sized 44x24 to clear the 24px minimum the other interactive controls use.
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 shadow-xs transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        "data-[state=unchecked]:border-border data-[state=unchecked]:bg-muted",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-background shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
          // Dark mode inverts which of the two is lighter, so the thumb has to be pulled
          // up explicitly or it would sit darker than the track it rides on.
          "dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
