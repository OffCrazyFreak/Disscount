import { Metadata } from "next";
import { Suspense } from "react";
import { Search } from "lucide-react";

import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import NoResults from "@/components/custom/common/no-results";
import { AnimatedGroup } from "@/components/custom/animation/animated-group";
import PostCard from "@/app/updates/components/post-card";
import NewPostButton from "@/app/updates/components/new-post-button";
import { templatePosts } from "@/app/updates/posts";
import { filterByFields, readSearchParam } from "@/utils/generic";

export const metadata: Metadata = {
  title: "Novosti",
  description: "Najnovije objave i novosti o Disscountu.",
};

export default async function UpdatesPage(props: PageProps<"/updates">) {
  const query = readSearchParam(await props.searchParams);

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
          searchRoute="/updates"
          clearable={true}
          submitButtonLocation="none"
          autoSearch={true}
        />
      </Suspense>

      <div className="flex items-center justify-between gap-4">
        <h1>
          {query.length > 0
            ? `Rezultati pretrage za "${query}" (${matchingPosts.length})`
            : `Novosti (${matchingPosts.length})`}
        </h1>

        <NewPostButton />
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
