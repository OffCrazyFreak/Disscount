"use client";

import { createContext, useContext } from "react";

import type { SecuritySettings } from "@/components/custom/settings/tabs/use-security-settings";

const SecurityContext = createContext<SecuritySettings | null>(null);

export const SecurityProvider = SecurityContext.Provider;

export function useSecurity(): SecuritySettings {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error("useSecurity must be used within SecurityProvider");
  }
  return context;
}
