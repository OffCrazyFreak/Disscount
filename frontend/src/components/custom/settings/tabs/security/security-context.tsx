"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { SecuritySettings } from "./use-security-settings";

const SecurityContext = createContext<SecuritySettings | null>(null);

interface SecurityProviderProps {
  value: SecuritySettings;
  children: ReactNode;
}

export function SecurityProvider({ value, children }: SecurityProviderProps) {
  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error("useSecurity must be used within a SecurityProvider");
  }
  return context;
}
