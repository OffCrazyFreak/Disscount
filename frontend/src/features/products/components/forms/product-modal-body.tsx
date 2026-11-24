import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { ProductResponse } from "@/lib/cijene-api/schemas";

interface IProductModalBodyProps {
  isLoading: boolean;
  product: ProductResponse | undefined;
  notFoundText: string;
  children: (product: ProductResponse) => ReactNode;
}

export default function ProductModalBody({
  isLoading,
  product,
  notFoundText,
  children,
}: IProductModalBodyProps) {
  if (isLoading) return <Skeleton className="h-24 w-full" />;

  if (!product) {
    return <p className="text-sm text-muted-foreground">{notFoundText}</p>;
  }

  return children(product);
}
