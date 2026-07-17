"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageUp, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface IImageResult {
  rawValue: string;
  format: string;
}

export default function ImageScanPanel() {
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<IImageResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decode(blob: Blob) {
    setError(null);
    setResults(null);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(blob);
    });

    try {
      const bitmap = await createImageBitmap(blob);
      const { BarcodeDetector } = await import("barcode-detector/ponyfill");
      const detector = new BarcodeDetector();
      const detected = await detector.detect(bitmap);

      setResults(
        detected.map((d) => ({ rawValue: d.rawValue, format: d.format })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    function handlePaste(event: ClipboardEvent) {
      const file = Array.from(event.clipboardData?.items ?? [])
        .find((item) => item.type.startsWith("image/"))
        ?.getAsFile();

      if (file) decode(file);
    }

    window.addEventListener("paste", handlePaste);

    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  return (
    <section className="space-y-4">
      <label
        className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) decode(file);
        }}
      >
        <ImageUp className="size-6" />
        Click to upload, drop an image, or paste a screenshot (Ctrl+V)
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) decode(file);
          }}
        />
      </label>

      {preview && (
        <div className="overflow-hidden rounded-xl border">
          <Image
            src={preview}
            alt="Uploaded code"
            width={800}
            height={400}
            unoptimized
            className="max-h-72 w-full object-contain"
          />
        </div>
      )}

      {error && (
        <p className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 font-mono text-xs text-destructive">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      )}

      {results?.length === 0 && (
        <p className="rounded-xl border border-dashed p-4 text-center font-mono text-xs text-muted-foreground">
          No codes found in this image
        </p>
      )}

      {results && results.length > 0 && (
        <ul className="space-y-2">
          {results.map((r, i) => (
            <li
              key={`${r.rawValue}-${i}`}
              className="flex items-center justify-between gap-3 rounded-xl border p-3"
            >
              <span className="min-w-0 truncate font-mono text-sm">
                {r.rawValue}
              </span>
              <Badge variant="outline" className="font-mono text-xs">
                {r.format}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
