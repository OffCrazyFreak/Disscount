"use client";

import type { ReactNode } from "react";

import SheetShell from "@/components/custom/modal/sheet-shell";
import SheetDivider from "@/components/custom/modal/sheet-divider";

interface IQuickActionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the sheet for assistive tech; the summary carries it visually. */
  title: string;
  description: string;
  /** How the entity draws in this sheet; injected, since it is feature code. */
  summary?: ReactNode;
  /** False while the entity is still resolving, or for good if it never does. */
  hasEntity: boolean;
  isLoading?: boolean;
  emptyMessage: string;
  children?: ReactNode;
}

/**
 * The shell every long-press actions sheet shares: a summary of what was pressed,
 * then its actions. Kept entity-agnostic so products and shopping lists differ
 * only in their summary and their action rows.
 */
export default function QuickActionsSheet({
  open,
  onOpenChange,
  title,
  description,
  summary,
  hasEntity,
  isLoading = false,
  emptyMessage,
  children,
}: IQuickActionsSheetProps) {
  return (
    <SheetShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      // The summary names the entity better than a truncated title row could.
      srOnlyTitle
      description={description}
      // Without an entity there are no action buttons, so the header's button is
      // the only way out of a sheet a shared link opened.
      showCloseButton={!hasEntity}
      bodyClassName="gap-2"
    >
      {summary}

      {hasEntity ? (
        <>
          <SheetDivider className="mb-1" />

          {children}
        </>
      ) : (
        !isLoading && (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )
      )}
    </SheetShell>
  );
}
