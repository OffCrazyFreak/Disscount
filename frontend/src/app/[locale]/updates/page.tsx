import { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Search } from "lucide-react";

import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import NoResults from "@/components/custom/common/no-results";
import { AnimatedGroup } from "@/components/custom/animation/animated-group";
import PostCard from "@/app/[locale]/updates/components/post-card";
import NewPostButton from "@/app/[locale]/updates/components/new-post-button";
import { templatePosts } from "@/app/[locale]/updates/posts";
import { localizePost } from "@/app/[locale]/updates/localize-post";
import { pageAlternates } from "@/i18n/alternates";
import { filterByFields, readSearchParam } from "@/utils/generic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("updates");

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: pageAlternates("/updates", locale),
  };
}

export default async function UpdatesPage(
  props: PageProps<"/[locale]/updates">,
) {
  const query = readSearchParam(await props.searchParams);
  const t = await getTranslations("updates");

  const matchingPosts = filterByFields(
    templatePosts.map((post) => localizePost(t, post)),
    query,
    ["title", "excerpt", "content"],
  );

  return (
    <div className="space-y-4">
      <Suspense fallback={<SearchBarSkeleton submitButtonLocation="none" />}>
        <SearchBar
          placeholder={t("searchPlaceholder")}
          searchRoute="/updates"
          clearable={true}
          submitButtonLocation="none"
          autoSearch={true}
        />
      </Suspense>

      <div className="flex items-center justify-between gap-4">
        <h1>
          {query.length > 0
            ? t("searchHeading", { query, count: matchingPosts.length })
            : t("heading", { count: matchingPosts.length })}
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
