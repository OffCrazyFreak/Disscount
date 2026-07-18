"use client";

import { Toaster } from "sonner";
import type { ReactNode } from "react";

export default function ToasterProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="bottom-right" />
    </>
  );
}
