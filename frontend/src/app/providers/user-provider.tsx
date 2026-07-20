"use client";

import { UserProvider } from "@/context/user-context";
import type { ReactNode } from "react";

export default function UserContextProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <UserProvider>{children}</UserProvider>;
}
