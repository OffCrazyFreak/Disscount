"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button-icon";
import { ScanBarcode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import BarcodeScanner from "@/components/custom/barcode-scanner";
import SearchBar from "@/components/custom/search-bar";

export default function HeroActions() {
  const [scannerOpen, setScannerOpen] = useState(false);
  const router = useRouter();

  const handleScan = (result: string) => {
    router.push(`/products?q=${encodeURIComponent(result)}`);
  };

  return (
    <>
      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />

      <Card className="bg-background max-w-xl mx-auto rounded-2xl shadow-xl p-8 space-y-4">
        <Suspense>
          <SearchBar
            placeholder="Pretraži proizvode..."
            searchRoute="/products"
            clearable={true}
            submitButtonLocation="Block"
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

        <div className="">
          <Button
            onClick={() => setScannerOpen(true)}
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
