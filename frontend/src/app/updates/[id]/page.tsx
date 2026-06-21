import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";

import { formatDate } from "@/utils/strings";
import { getPostById } from "@/app/updates/posts";

interface IPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: IPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = getPostById(id);

  return {
    title: post ? post.title : "Novosti",
    description: post?.excerpt ?? "Detalji objave.",
  };
}

export default async function PostDetailPage({ params }: IPageProps) {
  const { id } = await params;
  const post = getPostById(id);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link
        href="/updates"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        Natrag na novosti
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
          <span>{formatDate(post.date)}</span>
          <span aria-hidden>·</span>
          <span>{post.author}</span>
        </div>

        <h1 className="text-3xl font-bold text-pretty">{post.title}</h1>

        <div className="space-y-4 text-pretty leading-relaxed">
          {post.content.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
