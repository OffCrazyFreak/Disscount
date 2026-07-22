import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import TextGlow from "@/components/custom/common/text-glow";

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
    <div className={cn("relative isolate mx-auto max-w-2xl mb-10", className)}>
      <TextGlow />

      <div className="text-center space-y-3">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
          {title}
        </h2>

        {subtitle && (
          <p className="text-muted-foreground max-w-xl mx-auto text-pretty">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
