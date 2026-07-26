"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import BlockLoadingSpinner from "@/components/custom/common/block-loading-spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface IRemoveIconButtonProps {
  onClick: () => void;
  label: string;
  /** "destructive" deletes something; "neutral" only resets state, so it outlines */
  tone?: "destructive" | "neutral";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * An X that removes what it sits beside, naming itself through a tooltip so the
 * icon can stay small. Red for a deletion, outlined for a reset.
 */
export default function RemoveIconButton({
  onClick,
  label,
  tone = "destructive",
  loading = false,
  disabled = false,
  className,
}: IRemoveIconButtonProps) {
  const isDestructive = tone === "destructive";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant={isDestructive ? "destructive" : "outline"}
          aria-label={label}
          className={cn("size-9 shrink-0", className)}
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
      <TooltipContent
        variant={isDestructive ? "destructive" : "neutral"}
        className="px-2 py-1 text-xs"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
