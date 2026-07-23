"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface IRemoveIconButtonProps {
  onClick: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
}

// Red circular X used to remove the current item (watchlist entry, list item).
export function RemoveIconButton({
  onClick,
  label,
  loading = false,
  disabled = false,
}: IRemoveIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          aria-label={label}
          className="size-9 shrink-0 bg-red-600 hover:bg-red-700"
          onClick={onClick}
          disabled={loading || disabled}
        >
          {loading ? (
            <BlockLoadingSpinner size={20} className="text-inherit" />
          ) : (
            <X className="size-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent variant="destructive" className="px-2 py-1 text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
