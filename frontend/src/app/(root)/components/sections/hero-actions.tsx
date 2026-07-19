"use client";

import { useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScanBarcode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCameraScanner } from "@/context/scanner-context";
import { IScannedCode } from "@/typings/scanned-code";
import SearchBar from "@/components/custom/search/search-bar";
import SearchBarSkeleton from "@/components/custom/search/search-bar-skeleton";

export default function HeroActions() {
  const { openScanner } = useCameraScanner();
  const router = useRouter();

  const handleScan = useCallback(
    (code: IScannedCode) => {
      const value = code.rawValue.trim();
      if (!value) return;

      router.push(`/products/${encodeURIComponent(value)}`);
    },
    [router],
  );

  return (
    <>
      <Card className="bg-background max-w-xl mx-auto rounded-2xl shadow-xl p-8 space-y-4">
        <Suspense fallback={<SearchBarSkeleton submitButtonLocation="block" />}>
          <SearchBar
            placeholder="Pretraži proizvode..."
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
              ili
            </span>
          </div>
        </div>

        <div>
          <Button
            onClick={() => openScanner({ onScan: handleScan })}
            variant="outline"
            size="lg"
            className="w-full text-lg"
          >
            <ScanBarcode className="size-6 mr-2" />
            Skeniraj barkod
          </Button>
        </div>
      </Card>
    </>
  );
}
