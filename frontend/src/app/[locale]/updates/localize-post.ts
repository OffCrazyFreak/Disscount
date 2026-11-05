import type { getTranslations } from "next-intl/server";

import type { Post } from "@/app/[locale]/updates/posts";

export type LocalizedPost = {
  id: Post["id"];
  imageUrl: string;
  date: string;
  author: string;
  title: string;
  excerpt: string;
  content: string;
  paragraphs: string[];
};

type UpdatesTranslator = Awaited<ReturnType<typeof getTranslations<"updates">>>;

export function localizePost(t: UpdatesTranslator, post: Post): LocalizedPost {
  const paragraphs = post.paragraphs.map((key) =>
    t(`posts.${post.id}.body.${key}`),
  );

  return {
    id: post.id,
    imageUrl: post.imageUrl,
    date: post.date,
    author: t("author"),
    title: t(`posts.${post.id}.title`),
    excerpt: t(`posts.${post.id}.excerpt`),
    content: paragraphs.join("\n\n"),
    paragraphs,
  };
}
