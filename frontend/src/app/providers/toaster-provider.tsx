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
      {/* Cleared off the same token as every other bottom-anchored element */}
      <Toaster
        richColors
        position="bottom-right"
        mobileOffset={{ bottom: "var(--sheet-bottom-clearance)" }}
      />
    </>
  );
}
