import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface IMediaRowProps {
  /** Fills a square as tall as the row; leave it unset for a row without one. */
  media?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A square picture beside a row's content, always exactly as tall as that content. Only a grid
 * can do this: it sizes the rows first and then widens the column to the square's new width,
 * which a flex row never revisits. The picture sits absolutely, so its own file size never counts.
 */
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
