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
      <Toaster richColors position="bottom-right" />
    </>
  );
}
