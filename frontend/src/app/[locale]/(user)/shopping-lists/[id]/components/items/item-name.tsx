import StretchedLink from "@/components/custom/common/stretched-link";
import type { ShoppingListItemDto } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { productPath } from "@/utils/product-links";

interface IItemNameProps {
  item: ShoppingListItemDto;
  isFirst: boolean;
  isLast: boolean;
}

export default function ItemName({ item, isFirst, isLast }: IItemNameProps) {
  return (
    <div className="flex-1">
      <p
        className={`text-sm sm:text-md text-pretty ${
          item.isChecked ? "line-through text-gray-500" : ""
        }`}
      >
        <StretchedLink
          href={productPath(item.ean)}
          // The row is padded by its container, so the hit area bleeds past
          // it to cover the whole strip, rounding off at the list's ends.
          className={cn(
            "after:-left-4 after:-right-4",
            isFirst ? "after:-top-4 after:rounded-t-xl" : "after:top-0",
            isLast ? "after:-bottom-4 after:rounded-b-xl" : "after:bottom-0",
          )}
        >
          <span lang="hr">{item.name}</span>
        </StretchedLink>
      </p>
      {item.brand && (
        <p
          lang="hr"
          className="relative z-10 w-fit text-xs sm:text-sm text-gray-600 text-pretty"
        >
          {item.brand}
        </p>
      )}
    </div>
  );
}
