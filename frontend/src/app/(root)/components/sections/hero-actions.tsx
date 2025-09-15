"use client";

import { useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button-icon";
import { ScanBarcode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCameraScanner } from "@/context/scanner-context";
import SearchBar from "@/components/custom/search-bar";

export default function HeroActions() {
  const { openScanner } = useCameraScanner();
  const router = useRouter();

  const handleScan = useCallback(
    (result: string) => {
      const trimmedResult = result?.trim();
      if (!trimmedResult) return;
      router.push(`/products/${encodeURIComponent(trimmedResult)}`);
    },
    [router]
  );

  return (
    <>
      <Card className="bg-background max-w-xl mx-auto rounded-2xl shadow-xl p-8 space-y-4">
        <Suspense>
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
            <h2 className="bg-background text-lg px-2 text-muted-foreground">
              ili
            </h2>
          </div>
        </div>

        <div>
          <Button
            onClick={() => openScanner(handleScan)}
            variant="outline"
            size="lg"
            className="cursor-pointer w-full mb-6 text-lg py-6 border-2 border-primary hover:border-secondary hover:bg-green-50"
          >
            <ScanBarcode className="size-6 mr-2" />
            Skeniraj barkod
          </Button>
        </div>
      </Card>
    </>
  );
}
