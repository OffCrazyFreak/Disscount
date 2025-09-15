"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface IFloatingActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  className?: string;
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
  position = "bottom-right",
}: IFloatingActionButtonProps) {
  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <Tooltip>
        <TooltipTrigger>
          <div
            onClick={onClick}
            className={cn(
              "grid place-items-center cursor-pointer size-16 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg",
              className
            )}
          >
            {icon}
            <span className="sr-only">{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">{label}</TooltipContent>
      </Tooltip>
    </div>
  );
}
