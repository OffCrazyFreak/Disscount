"use client";

import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflineRetryButton() {
  return (
    <Button effect="shineHover" onClick={() => window.location.reload()}>
      <RotateCw className="size-4" />
      Pokušaj ponovno
    </Button>
  );
}
