"use client";

import { useDebouncedValue } from "@/hooks/use-debounced-value";

// Long enough that a screen reader hears a settled count, not one per keystroke.
const SETTLE_DELAY_MS = 600;

interface IDebouncedStatusProps {
  /** Empty while there is nothing to say, so the region exists before its first message */
  message: string;
}

/** Screen readers only; the region stays mounted because one added with its text already inside is not read out. */
export default function DebouncedStatus({ message }: IDebouncedStatusProps) {
  const announcement = useDebouncedValue(message, SETTLE_DELAY_MS);

  return (
    <p role="status" className="sr-only">
      {announcement}
    </p>
  );
}
