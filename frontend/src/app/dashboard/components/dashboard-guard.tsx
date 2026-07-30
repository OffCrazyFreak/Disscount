"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

import PageShellSkeleton from "@/components/custom/skeleton/page-shell-skeleton";
import { useUser } from "@/context/user-context";
import { canAccessDashboard } from "@/lib/api/schemas/auth-user";

interface IDashboardGuardProps {
  children: ReactNode;
}

export default function DashboardGuard({ children }: IDashboardGuardProps) {
  const router = useRouter();
  const { user, isLoading } = useUser();

  const allowed = canAccessDashboard(user?.accountType);

  useEffect(() => {
    if (!isLoading && !allowed) {
      router.replace("/");
    }
  }, [isLoading, allowed, router]);

  // Also covers the moment after a denial, while the redirect above runs.
  if (isLoading || !allowed) {
    return <PageShellSkeleton />;
  }

  return <>{children}</>;
}
