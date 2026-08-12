"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import ResponsiveLabel from "@/components/custom/common/responsive-label";
import { openModalUrl } from "@/lib/modal/modal-navigation";

export default function CreateDigitalCardButton() {
  return (
    <Button
      type="button"
      variant="primary"
      icon={Plus}
      iconPlacement="left"
      effect="shineHover"
      // No aria-label: ResponsiveLabel already supplies the accessible name per breakpoint.
      onClick={() => openModalUrl({ name: "digital-card", action: "new" })}
    >
      <ResponsiveLabel full="Dodaj digitalnu karticu" short="Dodaj karticu" />
    </Button>
  );
}
