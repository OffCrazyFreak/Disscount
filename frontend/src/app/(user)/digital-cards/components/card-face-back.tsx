import CardCode from "@/app/(user)/digital-cards/components/card-code";
import type { DigitalCardDto } from "@/lib/api/types";

interface ICardFaceBackProps {
  card: DigitalCardDto;
}

// Always black on white, whatever the card colour: a code needs that contrast to scan.
export default function CardFaceBack({ card }: ICardFaceBackProps) {
  return (
    <div className="absolute inset-0 grid place-items-center rounded-2xl bg-white p-3 shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
      <CardCode
        value={card.barcodeValue ?? card.codeValue}
        codeType={card.codeType}
        className="max-h-full w-full"
      />
    </div>
  );
}
