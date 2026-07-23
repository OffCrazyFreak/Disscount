import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface INotificationsEmptyStateProps {
  hasWatchlistItems: boolean;
  onAddProducts: () => void;
}

export default function NotificationsEmptyState({
  hasWatchlistItems,
  onAddProducts,
}: INotificationsEmptyStateProps) {
  return (
    <div className="p-2 space-y-4 text-center">
      <p className="text-sm text-muted-foreground text-pretty">
        {hasWatchlistItems
          ? "Danas nema popusta na praćenim proizvodima."
          : "Dodaj proizvode na popis za praćenje kako bi te obavijestili kada proizvodi koje želiš budu na popustu u tvojim trgovinama!"}
      </p>

      {!hasWatchlistItems && (
        <Button
          effect="shineHover"
          size={"default"}
          icon={Eye}
          iconPlacement="left"
          onClick={onAddProducts}
        >
          Dodaj proizvode
        </Button>
      )}
    </div>
  );
}
