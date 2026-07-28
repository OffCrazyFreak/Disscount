"use client";

import Link from "next/link";
import type { MouseEvent } from "react";

import { cn } from "@/lib/utils";
import { productPath } from "@/utils/product-links";

interface IProductOverlayLinkProps {
  ean: string;
  name: string | null;
  onNavigate?: (viaKeyboard: boolean) => boolean | void;
  className?: string;
}

export default function ProductOverlayLink({
  ean,
  name,
  onNavigate,
  className,
}: IProductOverlayLinkProps) {
  function handleNavigate(event: MouseEvent<HTMLAnchorElement>) {
    if (onNavigate?.(event.detail === 0) === false) {
      event.preventDefault();
    }
  }

  return (
    <Link
      href={productPath(ean)}
      aria-label={`Otvori proizvod: ${name || "Nepoznat proizvod"}`}
      onClick={handleNavigate}
      className={cn(
        "absolute z-10 cursor-pointer rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className ?? "inset-0",
      )}
    />
  );
}
