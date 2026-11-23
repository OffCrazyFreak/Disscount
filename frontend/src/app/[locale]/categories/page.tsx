import type { Metadata, ResolvingMetadata } from "next";
import { withSharePreview } from "@/utils/share-metadata";
import { connection } from "next/server";
import { getLocale, getTranslations } from "next-intl/server";

import {
  categoryName,
  departmentName,
} from "@/app/[locale]/categories/utils/category-names";
import {
  hubRobots,
  isHubIndexable,
} from "@/app/[locale]/categories/utils/category-page";
import PageBreadcrumbs from "@/components/custom/common/page-breadcrumbs";
import { Link } from "@/i18n/navigation";
import { localizedUrl } from "@/i18n/alternates";
import { getCatalogCategories } from "@/lib/api/catalog-categories/server";
import { CATEGORIES_PATH, categoryPath } from "@/utils/category-links";

export async function generateMetadata(
  _props: PageProps<"/[locale]/categories">,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("categories");

  return withSharePreview(
    {
      title: t("meta.indexTitle"),
      description: t("meta.indexDescription"),
      alternates: { canonical: localizedUrl(CATEGORIES_PATH, locale) },
      ...hubRobots(isHubIndexable(locale)),
    },
    parent,
  );
}

export default async function CategoriesPage() {
  // The backend is not reachable while the Docker image builds, so this renders per request.
  await connection();
  const locale = await getLocale();
  const t = await getTranslations("categories");
  const { departments, categories } = await getCatalogCategories();

  const groups = departments
    .map((department) => ({
      department,
      categories: categories.filter(
        (category) => category.department === department.slug,
      ),
    }))
    .filter((group) => group.categories.length > 0);

  return (
    <div className="space-y-6">
      <PageBreadcrumbs
        label={t("breadcrumbs.label")}
        steps={[
          { label: t("breadcrumbs.home"), path: "/" },
          { label: t("breadcrumbs.categories"), path: CATEGORIES_PATH },
        ]}
        locale={locale}
      />

      <h1 className="text-3xl font-bold text-pretty">{t("index.heading")}</h1>

      {groups.map(({ department, categories: inDepartment }) => (
        <section key={department.slug} className="space-y-3">
          <h2 className="text-lg font-semibold">
            {departmentName(t, department.slug)}
          </h2>

          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inDepartment.map((category) => (
              <li key={category.slug}>
                <Link
                  href={categoryPath(category.slug)}
                  className="flex h-full items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-medium">
                    {categoryName(t, category.slug)}
                  </span>

                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {t("index.productCount", { count: category.productCount })}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
