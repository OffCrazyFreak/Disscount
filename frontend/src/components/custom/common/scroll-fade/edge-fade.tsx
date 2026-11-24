import { cn } from "@/lib/utils";

interface IEdgeFadeProps {
  /** Edge to fade against, defaulting to the bottom */
  side?: "top" | "bottom";
  /** Positioning + colour overrides, e.g. "fixed z-40" or "from-sidebar" */
  className?: string;
}

/** Give it a positioning context via className and override `from-*` to match the surface it fades into. */
export default function EdgeFade({
  side = "bottom",
  className,
}: IEdgeFadeProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none inset-x-0 z-10 h-20 from-background to-transparent",
        side === "top" ? "top-0 bg-gradient-to-b" : "bottom-0 bg-gradient-to-t",
        className,
      )}
    />
  );
}
