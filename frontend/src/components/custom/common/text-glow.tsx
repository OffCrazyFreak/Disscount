import { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface ITextGlowProps {
  /** Peak opacity of the white glow, 0-1 */
  intensity?: number;
  /** Radius (%) held at full intensity before fading; higher = stronger */
  spread?: number;
  className?: string;
}

/**
 * Soft white radial glow that lifts a text block off the patterned background.
 * A solid core (`spread`) keeps it strong, while `closest-side` fades it to
 * transparent exactly at the wrapper edges - no hard rectangular cut-off.
 * Presentational; place it as the first child of a `relative isolate` wrapper.
 */
export default function TextGlow({
  intensity = 0.7,
  spread = 70,
  className,
}: ITextGlowProps) {
  const color = `rgba(255, 255, 255, ${intensity})`;

  const style: CSSProperties = {
    background: `radial-gradient(ellipse closest-side at 50% 50%, ${color} 0%, ${color} ${spread}%, transparent 100%)`,
  };

  return (
    <div
      aria-hidden
      style={style}
      className={cn("pointer-events-none absolute inset-0 -z-10", className)}
    />
  );
}
