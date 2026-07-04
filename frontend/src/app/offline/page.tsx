import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import OfflineRetryButton from "@/app/offline/components/offline-retry-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.offline");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function OfflinePage() {
  const t = await getTranslations("pages.offline");

  return (
    <div className="m-2 flex items-center justify-center min-h-[70dvh]">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4 text-muted-foreground">
          <CardTitle>
            <div className="text-2xl">{t("title")}</div>
          </CardTitle>

          <CardDescription className="space-y-2">
            <div>{t("description")}</div>

            <div className="text-gray-600">{t("checkConnection")}</div>
          </CardDescription>
        </CardHeader>

        <CardContent className="mt-2 flex items-center justify-center text-center">
          <OfflineRetryButton />
        </CardContent>
      </Card>
    </div>
  );
}
