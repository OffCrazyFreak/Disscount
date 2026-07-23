"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { Card } from "@/components/ui/card";
import UpvoteButton from "@/app/suggestions/components/upvote-button";
import { Suggestion } from "@/app/suggestions/suggestions";

interface ISuggestionCardProps {
  suggestion: Suggestion;
}

export default function SuggestionCard({ suggestion }: ISuggestionCardProps) {
  return (
    <Card className="p-0 transition-shadow hover:shadow-md">
      <Link
        href={`/suggestions/${suggestion.id}`}
        className="flex items-stretch gap-4 p-4"
      >
        <UpvoteButton initialUpvotes={suggestion.upvotes} />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="truncate text-lg font-bold">{suggestion.title}</h3>

          <p className="line-clamp-2 text-sm text-muted-foreground">
            {suggestion.description}
          </p>

          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MessageSquare className="size-4" />
            <span>{suggestion.comments.length}</span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
