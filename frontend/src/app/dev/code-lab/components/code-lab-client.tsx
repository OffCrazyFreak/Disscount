"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GeneratorPanel from "./generate/generator-panel";
import ScannerPanel from "./scan/scanner-panel";
import ImageScanPanel from "./image/image-scan-panel";

export default function CodeLabClient() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-6 space-y-1">
        <p className="font-mono text-xs tracking-[0.3em] text-primary uppercase">
          dev / playground
        </p>
        <h1 className="text-3xl font-bold">Code Lab</h1>
        <p className="text-sm text-muted-foreground">
          Compare barcode and QR generation and scanning engines before wiring
          them into digital cards. This page only lives on the feat/code-lab
          branch.
        </p>
      </header>

      <Tabs defaultValue="generate">
        <TabsList className="w-full">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="scan">Scan</TabsTrigger>
          <TabsTrigger value="image">Image</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="pt-4">
          <GeneratorPanel />
        </TabsContent>
        <TabsContent value="scan" className="pt-4">
          <ScannerPanel />
        </TabsContent>
        <TabsContent value="image" className="pt-4">
          <ImageScanPanel />
        </TabsContent>
      </Tabs>
    </main>
  );
}
