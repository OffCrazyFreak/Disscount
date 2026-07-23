"use client";

import Link from "next/link";
import { ArrowLeft, Calendar, MessageSquare } from "lucide-react";

import { Card } from "@/components/ui/card";
import UpvoteButton from "@/app/suggestions/components/upvote-button";
import { formatDate } from "@/utils/strings";
import { Suggestion } from "@/app/suggestions/suggestions";

interface ISuggestionDetailsClientProps {
  suggestion: Suggestion;
}

export default function SuggestionDetailsClient({
  suggestion,
}: ISuggestionDetailsClientProps) {
  return (
    <div className="space-y-6">
      <Link
        href="/suggestions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        Natrag na ideje i prijedloge
      </Link>

      <Card className="space-y-4 p-6">
        <div className="flex items-start gap-4">
          <UpvoteButton initialUpvotes={suggestion.upvotes} />

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-pretty">
              {suggestion.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              <span>{formatDate(suggestion.date)}</span>
              <span aria-hidden>·</span>
              <span>{suggestion.author}</span>
            </div>
          </div>
        </div>

        <p className="text-pretty">{suggestion.description}</p>
      </Card>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="size-5" />
          Komentari ({suggestion.comments.length})
        </h2>

        {suggestion.comments.length > 0 ? (
          <div className="space-y-3">
            {suggestion.comments.map((comment) => (
              <Card key={comment.id} className="space-y-1 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">{comment.author}</span>
                  <span className="text-muted-foreground">
                    {formatDate(comment.date)}
                  </span>
                </div>

                <p className="text-pretty text-sm">{comment.content}</p>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Još nema komentara. Budi prvi koji će komentirati kada značajka
            postane dostupna.
          </p>
        )}
      </section>
    </div>
  );
}
