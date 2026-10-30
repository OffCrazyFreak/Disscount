"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCallback, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ScanBarcode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCameraScanner } from "@/context/scanner-context";
import { IScannedCode } from "@/typings/scanned-code";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";
import { productPath } from "@/utils/product-links";

export default function HeroActions() {
  const t = useTranslations("landing");
  const { openScanner } = useCameraScanner();
  const router = useRouter();

  const handleScan = useCallback(
    (code: IScannedCode) => {
      const value = code.rawValue.trim();
      if (!value) return;

      router.push(productPath(value));
    },
    [router],
  );

  return (
    <>
      <Card className="bg-background max-w-xl mx-auto rounded-2xl shadow-xl p-8 space-y-4">
        <Suspense fallback={<SearchBarSkeleton submitButtonLocation="block" />}>
          <SearchBar
            placeholder={t("hero.searchPlaceholder")}
            searchRoute="/products"
            clearable={true}
            allowScanning={false}
            submitButtonLocation="block"
          />
        </Suspense>

        <div className="relative">
          <Separator />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-background text-lg px-2 text-muted-foreground">
              {t("hero.or")}
            </span>
          </div>
        </div>

        <div>
          <Button
            onClick={() => openScanner({ onScan: handleScan })}
            variant="outline"
            effect="shine"
            size="lg"
            className="w-full text-lg"
          >
            <ScanBarcode aria-hidden="true" className="size-6 mr-2" />
            {t("hero.scanBarcode")}
          </Button>
        </div>
      </Card>
    </>
  );
}
