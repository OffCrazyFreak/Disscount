import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IJumpSectionProps {
  /** Matches the id in the page's SectionJumpNav, and is the URL hash */
  id: string;
  children: ReactNode;
  className?: string;
}

/**
 * A page section that SectionJumpNav links to. It lands below the header and
 * the stuck bar, and takes focus on a jump so the next Tab starts inside it.
 */
export default function JumpSection({
  id,
  children,
  className,
}: IJumpSectionProps) {
  return (
    <section
      id={id}
      tabIndex={-1}
      className={cn(
        "scroll-mt-[var(--section-scroll-offset)] outline-none",
        className,
      )}
    >
      {children}
    </section>
  );
}
