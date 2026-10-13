import CardCode from "@/app/[locale]/(user)/digital-cards/components/card-code";
import type { DigitalCardDto } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface ICardFaceBackProps {
  card: DigitalCardDto;
}

// Always black on white, whatever the card colour: a code needs that contrast to scan.
export default function CardFaceBack({ card }: ICardFaceBackProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 grid place-items-center overflow-hidden rounded-2xl bg-white p-3 [backface-visibility:hidden] [transform:rotateY(180deg)]",
        "before:absolute before:inset-y-0 before:left-0 before:w-[7px] before:bg-[var(--c)]",
        "motion-safe:transition-shadow motion-safe:duration-150 forced-colors:border forced-colors:border-[color:CanvasText]",
        card.archivedAt
          ? "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--c)_60%,#ffffff),0_0_0_1px_var(--tile-outline)]"
          : "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--c)_60%,#ffffff),0_0_0_1px_var(--tile-outline),var(--tile-shadow)]",
      )}
    >
      <CardCode
        value={card.barcodeValue || card.codeValue}
        codeType={card.codeType}
        className="w-full"
        labelValue
        fitParentHeight
      />
    </div>
  );
}
