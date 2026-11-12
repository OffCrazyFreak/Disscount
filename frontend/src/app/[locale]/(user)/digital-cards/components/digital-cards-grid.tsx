import DigitalCardTile from "@/app/[locale]/(user)/digital-cards/components/digital-card-tile";
import type { DigitalCardDto } from "@/lib/api/types";

interface IDigitalCardsGridProps {
  cards: DigitalCardDto[];
  label: string;
}

export default function DigitalCardsGrid({
  cards,
  label,
}: IDigitalCardsGridProps) {
  return (
    <ul
      aria-label={label}
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3"
    >
      {cards.map((card) => (
        <li key={card.id}>
          <DigitalCardTile card={card} />
        </li>
      ))}
    </ul>
  );
}
