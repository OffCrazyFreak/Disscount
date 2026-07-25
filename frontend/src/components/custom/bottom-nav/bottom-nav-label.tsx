import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Collapses and fades with the bar's compaction; the bar's own height is fixed. */
const LABEL_STYLE: CSSProperties = {
  height: "var(--nav-label-height)",
  opacity: "var(--nav-label-opacity)",
};

interface IBottomNavLabelProps {
  children: ReactNode;
  isActive: boolean;
}

export default function BottomNavLabel({
  children,
  isActive,
}: IBottomNavLabelProps) {
  return (
    <span className="flex items-center overflow-hidden" style={LABEL_STYLE}>
      <span
        className={cn("text-[0.65rem] leading-none", isActive && "font-bold")}
      >
        {children}
      </span>
    </span>
  );
}
