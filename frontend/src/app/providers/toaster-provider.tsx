"use client";

import { Toaster } from "sonner";
import type { ReactNode } from "react";

export function ToasterProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="bottom-right" />
    </>
  );
}
