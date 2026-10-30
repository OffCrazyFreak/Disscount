import { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface ISquiggleUnderlineProps {
  className?: string;
}

// Hand-drawn wavy underline that draws itself in via the dis-draw keyframe.
export default function SquiggleUnderline({
  className,
}: ISquiggleUnderlineProps) {
  return (
    <svg
      viewBox="0 0 200 18"
      fill="none"
      aria-hidden="true"
      className={cn("pointer-events-none overflow-visible", className)}
      preserveAspectRatio="none"
    >
      <path
        d="M4 10 Q 16 3, 29 9 T 54 9 T 79 10 T 104 8 T 129 10 T 154 8 T 179 10 T 196 9"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        className="animate-dis-draw"
        style={{ "--dis-dash": 240 } as CSSProperties}
      />
    </svg>
  );
}
