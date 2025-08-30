"use client";

import React from "react";
import { ProductSearchBar } from "@/app/products/components/product-search-bar";
import { Button } from "@/components/ui/button-icon";
import { ScanBarcode } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function HeroActions(): React.JSX.Element {
  return (
    <Card className="bg-background max-w-xl mx-auto rounded-2xl shadow-xl p-8 space-y-4">
      <ProductSearchBar showSubmitButton showBarcode={false} />

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
          onClick={() => {
            console.log("Skeniranje barkoda...");
          }}
          variant="outline"
          size="lg"
          className="cursor-pointer w-full mb-6 text-lg py-6 border-2 border-primary hover:border-secondary hover:bg-green-50"
        >
          <ScanBarcode className="size-6 mr-2" />
          Skeniraj barkod
        </Button>
      </div>
    </Card>
  );
}
