import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import NotFoundClient from "@/app/not-found/components/not-found-client";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.notFound");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function NotFound() {
  const t = await getTranslations("pages.notFound");

  return (
    <div className="m-2 flex items-center justify-center min-h-[70dvh]">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4 text-muted-foreground">
          <CardTitle>
            <div className="text-6xl font-bold">404</div>

            <div className="text-2xl">{t("heading")}</div>
          </CardTitle>

          <CardDescription className="space-y-2">
            <div>
              {t("descriptionBefore")}
              <Suspense>
                <NotFoundClient />
              </Suspense>
              {t("descriptionAfter")}
            </div>

            <div className="text-gray-600">{t("help")}</div>
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center mt-2 flex flex-wrap gap-4 items-center justify-center">
          <Button variant={"outline"} effect={"shineHover"} asChild>
            <Link href="/">{t("reportError")}</Link>
            {/* TODO: contact form */}
          </Button>

          <Button
            asChild
            effect={"shineHover"}
            className="text-pretty whitespace-wrap"
          >
            <Link href="/" className="text-pretty whitespace-wrap">
              {t("backHome")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
