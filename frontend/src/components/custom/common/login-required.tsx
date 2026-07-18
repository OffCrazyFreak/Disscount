"use client";

import { ReactNode } from "react";
import { LogIn, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { openModalUrl } from "@/lib/modal/modal-navigation";

interface ILoginRequiredProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

/**
 * Friendly gate shown on authenticated-only pages when the visitor has no
 * session. Explains the feature and opens the shared auth modal.
 */
export default function LoginRequired({
  title,
  description = "Za korištenje ove značajke potrebna je prijava.",
  icon,
}: ILoginRequiredProps) {
  return (
    <div className="space-y-6">
      {title && <h1 className="text-3xl font-bold">{title}</h1>}

      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed py-16 px-6 text-center">
        {icon ?? <Lock className="size-12 text-primary" />}

        <p className="max-w-md text-pretty text-muted-foreground">
          {description}
        </p>

        <Button
          effect="shineHover"
          icon={LogIn}
          iconPlacement="left"
          onClick={() => openModalUrl({ name: "login" })}
        >
          Prijavi se
        </Button>
      </div>
    </div>
  );
}
