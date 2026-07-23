import Image from "next/image";
import Link from "next/link";
import { Calendar } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatDate } from "@/utils/strings";
import { Post } from "@/app/updates/posts";

export default function PostCard({ post }: { post: Post }) {
  return (
    <Card className="h-40 overflow-hidden p-0 transition-shadow hover:shadow-md">
      <Link href={`/updates/${post.id}`} className="flex h-full">
        <div className="relative aspect-square h-full shrink-0 bg-muted">
          <Image
            src={post.imageUrl}
            alt={post.title}
            fill
            className="object-cover"
            sizes="10rem"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1.5 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4 shrink-0" />
            <span>{formatDate(post.date)}</span>
            <span aria-hidden>·</span>
            <span className="truncate">{post.author}</span>
          </div>

          <h3 className="line-clamp-1 text-lg font-bold">{post.title}</h3>

          <p className="line-clamp-2 text-pretty text-sm text-muted-foreground">
            {post.excerpt}
          </p>
        </div>
      </Link>
    </Card>
  );
}
