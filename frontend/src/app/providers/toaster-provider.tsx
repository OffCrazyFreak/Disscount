"use client";

import { Toaster } from "sonner";
import type { ReactNode } from "react";

interface IToasterProviderProps {
  children: ReactNode;
}

export default function ToasterProvider({ children }: IToasterProviderProps) {
  return (
    <>
      {children}

      {/* Both offsets, because sonner only applies mobileOffset under 600px while
          the bar runs to 768px. The token is 0 above md, so desktop keeps a plain
          inset without sonner needing a breakpoint of its own. */}
      <Toaster
        richColors
        position="bottom-right"
        offset={{ bottom: "calc(var(--bottom-nav-total) + 0.5rem)" }}
        mobileOffset={{ bottom: "calc(var(--bottom-nav-total) + 0.5rem)" }}
      />
    </>
  );
}
