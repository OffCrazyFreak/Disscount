import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import NotFoundClient from "@/app/[locale]/not-found/components/not-found-client";
import { Suspense } from "react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { supportNavItems } from "@/constants/navigation";
import ComingSoonBadge from "@/components/custom/common/coming-soon-badge";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");

  return {
    title: t("notFound.meta.title"),
    description: t("notFound.meta.description"),
  };
}

export default function NotFound() {
  const t = useTranslations("common");
  const tShell = useTranslations("shell");
  const bugReport = supportNavItems.find((item) => item.id === "bug-report");
  const BugIcon = bugReport?.icon;
  const bugReportIsLive =
    bugReport && !bugReport.comingSoon && bugReport.href !== "#";

  const description = t.rich("notFound.description", {
    path: () => (
      <Suspense>
        <NotFoundClient />
      </Suspense>
    ),
  });

  return (
    <div className="m-2 flex items-center justify-center min-h-[70dvh]">
      <Card className="w-full max-w-md mx-auto py-8">
        <CardHeader className="text-center space-y-4 text-muted-foreground">
          <CardTitle>
            <div className="text-primary text-6xl font-bold">404</div>

            <div className="text-2xl">{t("notFound.heading")}</div>
          </CardTitle>

          <CardDescription className="space-y-2">
            <div>{description}</div>

            <div className="text-gray-600">{t("notFound.hint")}</div>
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center mt-2 flex flex-wrap gap-4 items-center justify-center">
          {bugReport &&
            BugIcon &&
            (bugReportIsLive ? (
              <Button variant="outline" effect="shineHover" asChild>
                <Link href={bugReport.href}>
                  <BugIcon className="size-4" />
                  {tShell(bugReport.labelKey)}
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                className="relative"
                disabled
                icon={BugIcon}
                iconPlacement="left"
              >
                {tShell(bugReport.labelKey)}

                <ComingSoonBadge className="absolute -top-2.5 right-1" />
              </Button>
            ))}

          <Button
            asChild
            effect="shineHover"
            className="text-pretty whitespace-wrap"
          >
            <Link href="/" className="text-pretty whitespace-wrap">
              {t("notFound.backHome")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
