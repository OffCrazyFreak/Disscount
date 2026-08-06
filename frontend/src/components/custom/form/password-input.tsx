"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState, type ComponentProps } from "react";

export function PasswordInput({
  className,
  ...props
}: Omit<ComponentProps<typeof Input>, "type">) {
  const [showPassword, setShowPassword] = useState(false);
  const Icon = showPassword ? EyeOffIcon : EyeIcon;

  return (
    <div className="relative">
      <Input
        {...props}
        type={showPassword ? "text" : "password"}
        className={cn("pr-9", className)}
      />
      <Button
        variant="ghost"
        size="icon"
        type="button"
        className="absolute inset-y-1/2 right-1 size-7 -translate-y-1/2 [&_svg]:size-5"
        onClick={() => setShowPassword((p) => !p)}
      >
        <Icon aria-hidden="true" className="size-5" />
        <span className="sr-only">
          {showPassword ? "Sakrij lozinku" : "Prikaži lozinku"}
        </span>
      </Button>
    </div>
  );
}
