import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface IMediaRowProps {
  /** Fills a square as tall as the row; leave it unset for a row without one. */
  media?: ReactNode;
  /** Replaces the row-tall square's height, such as a fixed size. */
  mediaClassName?: string;
  children: ReactNode;
  className?: string;
}

/** Only a grid sizes a square to its row, as flex never revisits the column; absolute ignores file size. */
export default function MediaRow({
  media,
  mediaClassName,
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
        <div
          className={cn(
            "relative aspect-square h-full [&>*]:absolute [&>*]:inset-0 [&>*]:size-full",
            mediaClassName,
          )}
        >
          {media}
        </div>
      )}
      {children}
    </div>
  );
}
