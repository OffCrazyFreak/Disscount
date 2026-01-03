import React, { MouseEvent, useState } from "react";
import { Eye, Image, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProductResponse } from "@/lib/cijene-api/schemas";
import { cn } from "@/lib/utils";
import AddToShoppingListForm from "@/app/products/components/forms/add-to-shopping-list-form";

interface IProductActionButtonsProps {
  product: ProductResponse;
  showSearchImage?: boolean;
  showAddToList?: boolean;
  showAddToWatchList?: boolean;
  className?: string;
}

export default function ProductActionButtons({
  product,
  showSearchImage = true,
  showAddToList = true,
  showAddToWatchList = true,
  className,
}: IProductActionButtonsProps) {
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);

  return (
    <>
      <AddToShoppingListForm
        isOpen={isAddToListModalOpen}
        onOpenChange={setIsAddToListModalOpen}
        product={product}
      />

      <div className={cn("flex items-center gap-1 sm:gap-2", className)}>
        {showSearchImage && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                aria-label="Pretraži sliku proizvoda"
                className="size-10 sm:size-12 shrink-0"
                onClick={() => {
                  const searchQuery = `${product.name}${
                    product.brand ? ` ${product.brand}` : ""
                  }`;
                  const googleShoppingUrl = `https://www.google.com/search?udm=2&q=${encodeURIComponent(
                    searchQuery
                  )}`;
                  window.open(googleShoppingUrl, "_blank");
                }}
              >
                <Image className="size-6 sm:size-7" />
              </Button>
            </TooltipTrigger>

            <TooltipContent className="px-2 py-1 text-xs">
              Pretraži sliku proizvoda
            </TooltipContent>
          </Tooltip>
        )}

        {showAddToList && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                aria-label="Dodaj na popis za kupnju"
                className="size-10 sm:size-12 shrink-0"
                onClick={() => {
                  setIsAddToListModalOpen(true);
                }}
              >
                <ListPlus className="size-6 sm:size-7" />
              </Button>
            </TooltipTrigger>

            <TooltipContent className="px-2 py-1 text-xs">
              Dodaj na popis za kupnju
            </TooltipContent>
          </Tooltip>
        )}

        {showAddToWatchList && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                aria-label="Prati proizvod"
                className="size-10 sm:size-12 shrink-0"
                onClick={() => {
                  // TODO: Implement follow product functionality
                }}
              >
                <Eye className="size-6 sm:size-7" />
              </Button>
            </TooltipTrigger>

            <TooltipContent className="px-2 py-1 text-xs">
              Prati proizvod
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </>
  );
}
