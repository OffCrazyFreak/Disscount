import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface IMediaRowProps {
  /** A square beside the text; leave it unset for a row without one. */
  media?: ReactNode;
  /** The square's size, which the caller fixes so long text grows the row and not the photo. */
  mediaClassName?: string;
  children: ReactNode;
  className?: string;
}

/** The caller fixes the square's size, so long text grows the row and never the photo; absolute ignores file size. */
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
            "relative aspect-square self-start [&>*]:absolute [&>*]:inset-0 [&>*]:size-full",
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
