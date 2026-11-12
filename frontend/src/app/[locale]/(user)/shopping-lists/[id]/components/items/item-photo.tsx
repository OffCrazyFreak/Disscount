import ProductThumbnail from "@/components/custom/product-photos/product-thumbnail";
import type { ShoppingListItemDto } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface IItemPhotoProps {
  item: ShoppingListItemDto;
}

export default function ItemPhoto({ item }: IItemPhotoProps) {
  return (
    <ProductThumbnail
      ean={item.ean}
      className={cn("size-10 sm:size-12", item.isChecked && "opacity-50")}
    />
  );
}
