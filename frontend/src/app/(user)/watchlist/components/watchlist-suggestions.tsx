import { useState } from "react";
import { ChevronDown } from "lucide-react";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import WatchlistItem from "@/app/(user)/watchlist/components/watchlist-item";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { IWatchlistSearchItem } from "@/app/(user)/watchlist/typings/watchlist-types";

interface IWatchlistSuggestionsProps {
  items: IWatchlistSearchItem[];
  isLoading: boolean;
}

export default function WatchlistSuggestions({
  items,
  isLoading,
}: IWatchlistSuggestionsProps) {
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(true);

  return (
    <Collapsible open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen}>
      <CollapsibleTrigger asChild className="cursor-pointer py-2">
        <button type="button" className="w-full text-left">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">
              Prijedlozi proizvoda za praćenje ({items.length})
            </h2>

            <Separator className="flex-1 my-2" />

            <div className="flex items-center gap-4">
              <p className="hidden sm:inline text-gray-700 text-sm">
                {isSuggestionsOpen ? "Sakrij" : "Prikaži"}
              </p>

              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "size-8 text-gray-500 transition-transform flex-shrink-0",
                  isSuggestionsOpen && "rotate-180",
                )}
              />
            </div>
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {isLoading ? (
          <div className="grid place-items-center py-6">
            <BlockLoadingSpinner />
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <WatchlistItem
                key={`suggestion-${item.productApiId}`}
                item={item}
                actionMode="add"
                showThresholdBadges={false}
              />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
