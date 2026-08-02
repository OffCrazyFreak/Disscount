import { ChevronDown } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface ISectionHeaderSkeletonProps {
  /**
   * Pass it when the heading is fixed copy: static text is not a placeholder and
   * should just render. Omit it when the heading carries data, such as a count.
   */
  title?: string;
  titleWidth?: string;
}

/**
 * The collapsed header row of CollapsibleSection, and of the items section,
 * which builds the same row inline. Geometry is copied from
 * components/custom/common/collapsible-section.tsx: keep the two in step.
 */
export default function SectionHeaderSkeleton({
  title,
  titleWidth = "12rem",
}: ISectionHeaderSkeletonProps) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-4">
        {title ? (
          <h2 className="text-lg font-semibold">{title}</h2>
        ) : (
          <div className="text-lg font-semibold">
            <Skeleton className="h-[1lh]" style={{ width: titleWidth }} />
          </div>
        )}

        <Separator className="flex-1 my-2" />

        <div className="flex items-center gap-4">
          <p className="hidden sm:inline text-gray-700 text-sm">Prikaži</p>

          <ChevronDown
            aria-hidden="true"
            className="size-8 text-gray-500 flex-shrink-0"
          />
        </div>
      </div>
    </div>
  );
}
