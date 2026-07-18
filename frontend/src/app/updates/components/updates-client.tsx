"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import NoResults from "@/components/custom/common/no-results";
import { Button } from "@/components/ui/button";
import { AnimatedGroup } from "@/components/ui/animated-group";
import PostCard from "@/app/updates/components/post-card";
import { templatePosts } from "@/app/updates/posts";
import { useUser } from "@/context/user-context";
import { isAdmin } from "@/lib/api/schemas/auth-user";
import { filterByFields } from "@/utils/generic";

export default function UpdatesClient({ query }: { query: string }) {
  const pathname = usePathname();
  const { user } = useUser();

  const userIsAdmin = isAdmin(user?.accountType);

  const matchingPosts = filterByFields(templatePosts, query, [
    "title",
    "excerpt",
    "content",
  ]);

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder="Pretraži novosti..."
          searchRoute={pathname}
          clearable={true}
          submitButtonLocation="none"
          autoSearch={true}
        />
      </Suspense>

      <div className="flex items-center justify-between gap-4">
        <h3>
          {query.length > 0
            ? `Rezultati pretrage za "${query}" (${matchingPosts.length})`
            : `Novosti (${matchingPosts.length})`}
        </h3>

        {userIsAdmin && (
          <Button
            effect="shineHover"
            icon={Plus}
            iconPlacement="left"
            onClick={() =>
              toast.info("Stvaranje objava bit će uskoro dostupno.")
            }
          >
            Nova objava
          </Button>
        )}
      </div>

      {matchingPosts.length > 0 ? (
        <AnimatedGroup className="space-y-4" preset="blur-slide">
          {matchingPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </AnimatedGroup>
      ) : (
        <NoResults
          icon={<Search className="size-12 text-gray-400 mx-auto mb-4" />}
        />
      )}
    </div>
  );
}
