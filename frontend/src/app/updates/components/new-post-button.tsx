"use client";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";

export default function NewPostButton() {
  const { user } = useUser();

  if (!isAdmin(user?.accountType)) return null;

  return (
    <Button
      effect="shineHover"
      icon={Plus}
      iconPlacement="left"
      onClick={() => toast.info("Stvaranje objava bit će uskoro dostupno.")}
    >
      Nova objava
    </Button>
  );
}
