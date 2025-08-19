"use client";

import React from "react";
import ProductSearchBar from "@/components/products/product-search-bar";
import { Button } from "@/components/ui/button";
import { ScanBarcode } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function HeroActions(): React.JSX.Element {
  return (
    <Card className="bg-white max-w-xl mx-auto rounded-2xl shadow-xl p-8 mb-8">
      <ProductSearchBar showSubmitButton />

      <h2 className="text-xl font-bold uppercase">ili</h2>

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
