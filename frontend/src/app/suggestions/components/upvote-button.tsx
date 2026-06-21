"use client";

import { useState, type MouseEvent } from "react";
import { ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

// Local-only upvote toggle for the template suggestions (no backend yet).
export default function UpvoteButton({
  initialUpvotes,
  className,
}: {
  initialUpvotes: number;
  className?: string;
}) {
  const [hasVoted, setHasVoted] = useState(false);

  const upvotes = initialUpvotes + (hasVoted ? 1 : 0);

  function toggleVote(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setHasVoted((previous) => !previous);
  }

  return (
    <button
      type="button"
      onClick={toggleVote}
      aria-pressed={hasVoted}
      className={cn(
        "flex shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border px-3 py-2 transition-colors",
        hasVoted
          ? "border-primary bg-primary/10 text-primary"
          : "hover:border-primary/50 hover:text-primary",
        className,
      )}
    >
      <ChevronUp className="size-5" />
      <span className="text-sm font-bold tabular-nums">{upvotes}</span>
    </button>
  );
}
