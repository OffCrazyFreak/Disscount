"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import CardBalanceFields from "@/app/(user)/digital-cards/components/forms/card-balance-fields";
import CardDatesFields from "@/app/(user)/digital-cards/components/forms/card-dates-fields";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { DigitalCardRequest } from "@/lib/api/types";

export default function CardDetailsSection() {
  const form = useFormContext<DigitalCardRequest>();
  const [cardType, validFrom, expiresOn, balance] = useWatch({
    control: form.control,
    name: ["cardType", "validFrom", "expiresOn", "balance"],
  });

  const { errors } = useFormState({
    control: form.control,
    name: ["validFrom", "expiresOn", "balance", "balanceUnit"],
  });

  // Starts open when the card already has details; the user's own toggle wins after that.
  const [toggled, setToggled] = useState<boolean | null>(null);
  const hasDetails = !!validFrom || !!expiresOn || balance != null;
  // A collapsed field with an error would block Save with no visible reason.
  const hasError =
    !!errors.validFrom ||
    !!errors.expiresOn ||
    (cardType === "gift" && (!!errors.balance || !!errors.balanceUnit));
  const open = hasError || (toggled ?? hasDetails);

  return (
    <Collapsible open={open} onOpenChange={setToggled}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md py-2 text-sm font-medium">
        Više detalja
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 transition-transform motion-reduce:transition-none",
            open && "rotate-180",
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4 px-0.5">
        <CardDatesFields />
        {cardType === "gift" && <CardBalanceFields />}
      </CollapsibleContent>
    </Collapsible>
  );
}
