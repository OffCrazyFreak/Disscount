import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import OfflineRetryButton from "@/app/[locale]/offline/components/offline-retry-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");

  return {
    title: t("offline.meta.title"),
    description: t("offline.meta.description"),
  };
}

export default function OfflinePage() {
  const t = useTranslations("common");

  return (
    <div className="m-2 flex items-center justify-center min-h-[70dvh]">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4 text-muted-foreground">
          <CardTitle>
            <div className="text-2xl">{t("offline.title")}</div>
          </CardTitle>

          <CardDescription className="space-y-2">
            <div>{t("offline.description")}</div>

            <div className="text-gray-600">{t("offline.hint")}</div>
          </CardDescription>
        </CardHeader>

        <CardContent className="mt-2 flex items-center justify-center text-center">
          <OfflineRetryButton />
        </CardContent>
      </Card>
    </div>
  );
}
