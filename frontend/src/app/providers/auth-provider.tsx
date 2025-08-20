"use client";

import { AuthProvider as AuthContextProvider } from "@/lib/auth-context";
import type { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}
