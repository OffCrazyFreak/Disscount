"use client";

import type { RefObject } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";
import SearchBar from "@/components/custom/search/search-bar";
import { discountedNavItem } from "@/constants/navigation";
import { useUser } from "@/context/user-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";

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
    </>
  );
}
