import { Link } from "@/i18n/navigation";
import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";

import { ArrowLeft, Calendar } from "lucide-react";

import { formatDate } from "@/utils/strings";
import { getPostById, templatePosts } from "@/app/[locale]/updates/posts";
import { localizePost } from "@/app/[locale]/updates/localize-post";
import { pageAlternates } from "@/i18n/alternates";

export function generateStaticParams() {
  return templatePosts.map((post) => ({ id: post.id }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/updates/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const post = getPostById(id);
  const locale = await getLocale();
  const t = await getTranslations("updates");
  const localized = post ? localizePost(t, post) : undefined;

  return {
    title: localized ? localized.title : t("meta.title"),
    description: localized?.excerpt ?? t("meta.detailFallbackDescription"),
    alternates: pageAlternates(`/updates/${id}`, locale),
  };
}

export default async function PostDetailPage(
  props: PageProps<"/[locale]/updates/[id]">,
) {
  const { id } = await props.params;
  const found = getPostById(id);

  if (!found) {
    notFound();
  }

  const locale = await getLocale();
  const t = await getTranslations("updates");
  const post = localizePost(t, found);

  return (
    <div className="space-y-6">
      <Link
        href="/updates"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        {t("backToList")}
      </Link>

      <article className="space-y-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 48rem"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="size-4" />
          <span>{formatDate(post.date, locale)}</span>
          <span aria-hidden>{t("separator")}</span>
          <span>{post.author}</span>
        </div>

        <h1 className="text-3xl font-bold text-pretty">{post.title}</h1>

        <div className="space-y-4 text-pretty leading-relaxed">
          {post.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
