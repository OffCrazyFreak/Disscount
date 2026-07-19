import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ISectionHeadingProps {
  title: ReactNode;
  subtitle?: string;
  className?: string;
}

export default function SectionHeading({
  title,
  subtitle,
  className,
}: ISectionHeadingProps) {
  return (
    <div className={cn("text-center space-y-3 mb-10", className)}>
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
        {title}
      </h2>

      {subtitle && (
        <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
          {subtitle}
        </p>
      )}
    </div>
  );
}
