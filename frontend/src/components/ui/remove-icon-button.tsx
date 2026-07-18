"use client";

import { X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RemoveIconButtonProps {
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
}: RemoveIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          aria-label={label}
          className="size-9 shrink-0 bg-red-600 hover:bg-red-700"
          onClick={onClick}
          disabled={loading || disabled}
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <X className="size-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="px-2 py-1 text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}
