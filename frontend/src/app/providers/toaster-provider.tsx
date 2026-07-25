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

      {/* Cleared over the bottom nav, which owns that strip below md */}
      <Toaster
        richColors
        position="bottom-right"
        mobileOffset={{ bottom: "calc(var(--bottom-nav-total) + 0.5rem)" }}
      />
    </>
  );
}
