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
      {/* Lifted clear of the bottom nav, off the same token the bar's height uses */}
      <Toaster
        richColors
        position="bottom-right"
        mobileOffset={{ bottom: "calc(var(--bottom-nav-total) + 1rem)" }}
      />
    </>
  );
}
