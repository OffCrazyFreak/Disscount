"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";

import CardCode from "@/app/[locale]/(user)/digital-cards/components/card-code";
import CodeTypeSwitcher from "@/app/[locale]/(user)/digital-cards/components/view/code-type-switcher";
import { codeTypeAlternatives } from "@/app/[locale]/(user)/digital-cards/utils/code-alternatives";
import { cardRequestFromDto } from "@/app/[locale]/(user)/digital-cards/utils/card-request-from-dto";
import { generateCodeSvg } from "@/app/[locale]/(user)/digital-cards/utils/generate-code-svg";
import { groupCodeValue } from "@/app/[locale]/(user)/digital-cards/utils/group-code-value";
import { Button } from "@/components/ui/button";
import {
  TWO_DIMENSIONAL_CODE_TYPES,
  type CodeType,
} from "@/constants/card-codes";
import digitalCardService from "@/lib/api/digital-cards";
import type { DigitalCardDto } from "@/lib/api/types";

// A rotated linear code needs its length as height; capped so it fits a short screen.
const ROTATED_LENGTH = "min(70dvh, 24rem)";

interface ICardCodePanelProps {
  card: DigitalCardDto;
}

export default function CardCodePanel({ card }: ICardCodePanelProps) {
  const [override, setOverride] = useState<CodeType | null>(null);
  const [rotatedRequested, setRotated] = useState(false);
  const { mutate: saveCard, isPending: isSaving } =
    digitalCardService.useSaveDigitalCard();

  // The bars may encode a different string than the printed number.
  const drawnValue = card.barcodeValue || card.codeValue;
  const shownType = override ?? card.codeType;
  const alternatives = codeTypeAlternatives(drawnValue, shownType);
  const drawable = generateCodeSvg(drawnValue, shownType).ok;
  const isLinear = drawable && !TWO_DIMENSIONAL_CODE_TYPES.includes(shownType);
  const rotated = rotatedRequested && isLinear;

  function handleSave() {
    if (!override) return;
    saveCard(
      { id: card.id, data: cardRequestFromDto(card, { codeType: override }) },
      { onSuccess: () => setOverride(null) },
    );
  }

  return (
    <section aria-label="Kod kartice" className="flex flex-col gap-3">
      {/* Stark white in dark mode too: a scanner needs contrast, not theming. */}
      <div className="rounded-2xl bg-white p-3 text-black ring-1 ring-black/10 dark:ring-white/30">
        <CardCode
          value={drawnValue}
          codeType={shownType}
          textFallback={false}
          rotatedLength={rotated ? ROTATED_LENGTH : undefined}
        />

        <p className="mt-2 break-all text-center font-mono text-2xl font-semibold tracking-wider">
          {groupCodeValue(card.codeValue)}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {isLinear && (
          <Button
            variant="outline"
            size="sm"
            icon={RotateCw}
            iconPlacement="left"
            aria-pressed={rotated}
            onClick={() => setRotated(!rotated)}
          >
            Zakreni kod
          </Button>
        )}

        <CodeTypeSwitcher
          shownType={shownType}
          savedType={card.codeType}
          canSwitch={alternatives.length > 0}
          isSaving={isSaving}
          onNext={() => setOverride(alternatives[0])}
          onSave={handleSave}
        />
      </div>
    </section>
  );
}
