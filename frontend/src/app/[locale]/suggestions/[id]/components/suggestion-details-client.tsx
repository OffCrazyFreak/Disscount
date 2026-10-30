"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, Calendar, MessageSquare } from "lucide-react";

import { Card } from "@/components/ui/card";
import UpvoteButton from "@/app/[locale]/suggestions/components/upvote-button";
import { formatDate } from "@/utils/strings";
import { Suggestion } from "@/app/[locale]/suggestions/suggestions";

interface ISuggestionDetailsClientProps {
  suggestion: Suggestion;
}

export default function SuggestionDetailsClient({
  suggestion,
}: ISuggestionDetailsClientProps) {
  const t = useTranslations("suggestions");
  const locale = useLocale();

  return (
    <div className="space-y-6">
      <Link
        href="/suggestions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        {t("backToList")}
      </Link>

      <Card className="space-y-4 p-6">
        <div className="flex items-start gap-4">
          <UpvoteButton initialUpvotes={suggestion.upvotes} />

          <div className="space-y-1">
            <h1 lang="hr" className="text-2xl font-bold text-pretty">
              {suggestion.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              <span>{formatDate(suggestion.date, locale)}</span>
              <span aria-hidden>{t("separator")}</span>
              <span lang="hr">{suggestion.author}</span>
            </div>
          </div>
        </div>

        <p lang="hr" className="text-pretty">
          {suggestion.description}
        </p>
      </Card>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="size-5" />
          {t("comments", { count: suggestion.comments.length })}
        </h2>

        {suggestion.comments.length > 0 ? (
          <div className="space-y-3">
            {suggestion.comments.map((comment) => (
              <Card key={comment.id} className="space-y-1 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span lang="hr" className="font-semibold">
                    {comment.author}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDate(comment.date, locale)}
                  </span>
                </div>

                <p lang="hr" className="text-pretty text-sm">
                  {comment.content}
                </p>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noComments")}</p>
        )}
      </section>
    </div>
  );
}
