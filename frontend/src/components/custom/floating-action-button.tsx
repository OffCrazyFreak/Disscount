"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface IFloatingActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  className?: string;
  disabled?: boolean;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

const positionClasses = {
  "bottom-right": "bottom-28 right-4",
  "bottom-left": "bottom-28 left-4",
  "top-right": "top-28 right-4",
  "top-left": "top-28 left-4",
};

export function FloatingActionButton({
  onClick,
  icon,
  label,
  className,
  disabled = false,
  position = "bottom-right",
}: IFloatingActionButtonProps) {
  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className={cn("size-16 rounded-full shadow-lg", className)}
          >
            {icon}
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">{label}</TooltipContent>
      </Tooltip>
    </div>
  );
}
