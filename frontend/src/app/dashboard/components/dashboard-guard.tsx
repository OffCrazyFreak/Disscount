"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
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

  if (isLoading || !allowed) {
    return (
      <div className="flex justify-center py-24">
        <BlockLoadingSpinner size={24} />
      </div>
    );
  }

  return <>{children}</>;
}
