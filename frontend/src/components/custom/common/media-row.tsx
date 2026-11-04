import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface IMediaRowProps {
  /** Fills a square as tall as the row; leave it unset for a row without one. */
  media?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Only a grid can size a square to its row, because a flex row never revisits the column width; absolute so file size never counts. */
export default function MediaRow({
  media,
  children,
  className,
}: IMediaRowProps) {
  return (
    <div
      className={cn(
        "grid gap-x-4",
        media ? "grid-cols-[auto_minmax(0,1fr)]" : "grid-cols-1",
        className,
      )}
    >
      {media && (
        <div className="relative aspect-square h-full [&>*]:absolute [&>*]:inset-0 [&>*]:size-full">
          {media}
        </div>
      )}
      {children}
    </div>
  );
}
