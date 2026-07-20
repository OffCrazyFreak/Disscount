import { cn } from "@/lib/utils";

interface ISparkleDoodleProps {
  className?: string;
  delay?: number;
  duration?: number;
}

// Four-point sparkle that twinkles forever; stagger siblings via delay and
// vary their rhythm via duration (both in seconds).
export default function SparkleDoodle({
  className,
  delay = 0,
  duration = 2.4,
}: ISparkleDoodleProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("pointer-events-none animate-dis-twinkle", className)}
      style={{ animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
    >
      <path
        d="M12 2.5c.8 4.3 1.9 6.2 6.1 7-4.2.8-5.3 2.7-6.1 7-.8-4.3-1.9-6.2-6.1-7 4.2-.8 5.3-2.7 6.1-7z"
        fill="currentColor"
      />
    </svg>
  );
}
