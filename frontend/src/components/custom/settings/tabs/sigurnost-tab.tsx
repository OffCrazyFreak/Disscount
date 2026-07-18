"use client";

import {
  ShieldCheck,
  Link2,
  TriangleAlert,
  Loader2,
  type LucideIcon,
} from "lucide-react";

import AccountCredentialsForm from "@/components/custom/header/forms/account-credentials-form";
import LinkedAccounts from "@/components/custom/header/forms/linked-accounts";
import { cn } from "@/lib/utils";
import { DangerZone } from "@/components/custom/settings/tabs/danger-zone";
import { useSecurity } from "@/components/custom/settings/tabs/security-context";

function SectionLabel({
  icon: Icon,
  className,
  children,
}: {
  icon: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
        className
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </div>
  );
}

export function SigurnostTab() {
  const { status, accounts, reload } = useSecurity();

  return (
    <div className="flex flex-col gap-6">
      {status === "pending" && (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-destructive">
          Greška pri dohvaćanju podataka o računu. Pokušaj ponovo.
        </p>
      )}

      {status === "success" && (
        <>
          <section className="space-y-3">
            <SectionLabel icon={ShieldCheck}>Prijava i sigurnost</SectionLabel>
            <AccountCredentialsForm />
          </section>

          <section className="space-y-3">
            <SectionLabel icon={Link2}>Povezani računi</SectionLabel>
            <LinkedAccounts accounts={accounts} onChanged={reload} />
          </section>
        </>
      )}

      <section className="space-y-4">
        <SectionLabel icon={TriangleAlert} className="text-destructive">
          Opasna zona
        </SectionLabel>
        <DangerZone />
      </section>
    </div>
  );
}
