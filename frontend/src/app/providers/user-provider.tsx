"use client";

import { UserProvider } from "@/context/user-context";
import type { ReactNode } from "react";

interface IUserContextProviderProps {
  children: ReactNode;
}

export default function UserContextProvider({
  children,
}: IUserContextProviderProps) {
  return <UserProvider>{children}</UserProvider>;
}
