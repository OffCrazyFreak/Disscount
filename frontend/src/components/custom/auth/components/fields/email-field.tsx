import type { UseFormRegisterReturn } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface IEmailFieldProps {
  registration: UseFormRegisterReturn;
  error?: string;
  id?: string;
}

export default function EmailField({
  registration,
  error,
  id = "email",
}: IEmailFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Email</Label>
      <Input
        id={id}
        type="email"
        placeholder="korisnik@example.com"
        autoComplete="email"
        {...registration}
        className={cn(error && "border-red-700")}
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
