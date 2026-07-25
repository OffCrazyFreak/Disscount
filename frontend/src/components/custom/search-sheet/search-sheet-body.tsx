"use client";

import { useState, type RefObject } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import SearchBar from "@/components/custom/search/search-bar";
import SearchSheetFiltersLive from "@/components/custom/search-sheet/search-sheet-filters-live";
import SearchSheetFiltersTravel from "@/components/custom/search-sheet/search-sheet-filters-travel";
import { discountedNavItem } from "@/constants/navigation";
import { useUser } from "@/context/user-context";
import { useSearchSheet } from "@/context/search-sheet-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";
import { cn } from "@/lib/utils";

interface ISearchSheetBodyProps {
  formId: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onCanSubmitChange: (canSubmit: boolean) => void;
}

export default function SearchSheetBody({
  formId,
  inputRef,
  onCanSubmitChange,
}: ISearchSheetBodyProps) {
  const { user } = useUser();
  const pathname = usePathname();
  const { filtersExpanded, setFiltersExpanded } = useSearchSheet();
  const [typedQuery, setTypedQuery] = useState("");

  const isDiscountedLocked =
    Boolean(discountedNavItem.comingSoon) && !isAdmin(user?.accountType);

  return (
    <>
      <SearchBar
        placeholder="Pretraži proizvode..."
        searchRoute="/products"
        clearable
        allowScanning
        submitButtonLocation="none"
        formId={formId}
        inputRef={inputRef}
        onCanSubmitChange={onCanSubmitChange}
        onQueryChange={setTypedQuery}
      />

      {/* Presented exactly as the sidebar presents a teaser, and locked by the
          same rule, so the two never disagree about what is available. */}
      <Button
        asChild={!isDiscountedLocked}
        type="button"
        variant="outline"
        disabled={isDiscountedLocked}
        className="w-full justify-between"
      >
        {isDiscountedLocked ? (
          <>
            {discountedNavItem.label}
            <ComingSoonBadge />
          </>
        ) : (
          <Link href={discountedNavItem.href}>
            {discountedNavItem.label}
            <ComingSoonBadge />
          </Link>
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        aria-expanded={filtersExpanded}
        className="w-full justify-between"
        onClick={() => setFiltersExpanded(!filtersExpanded)}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="size-4" />
          Filteri
        </span>

        <ChevronDown
          className={cn(
            "size-4 transition-transform motion-reduce:transition-none",
            filtersExpanded && "rotate-180",
          )}
        />
      </Button>

      {/* The route guard lives here, outside the units that call the hooks: a
          guard cannot share a unit with the hooks it guards. */}
      {filtersExpanded &&
        (pathname === "/products" ? (
          <SearchSheetFiltersLive />
        ) : (
          <SearchSheetFiltersTravel typedQuery={typedQuery} />
        ))}
    </>
  );
}
