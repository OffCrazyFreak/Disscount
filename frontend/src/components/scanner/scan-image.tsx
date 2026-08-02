"use client";

import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ALL_SCAN_FORMATS, SCAN_FORMATS_BY_PRESET } from "@/constants/scanner";
import { IScannedCode, ScanPreset } from "@/typings/scanned-code";

const MAX_SCAN_IMAGE_DIMENSION = 2048;

interface IScanImageButtonProps {
  preset: ScanPreset;
  onScan: (code: IScannedCode) => void;
}

async function createScanBitmap(file: File): Promise<ImageBitmap> {
  const source = await createImageBitmap(file);
  const largestDimension = Math.max(source.width, source.height);

  if (largestDimension <= MAX_SCAN_IMAGE_DIMENSION) return source;

  const scale = MAX_SCAN_IMAGE_DIMENSION / largestDimension;

  try {
    return await createImageBitmap(source, {
      resizeWidth: Math.round(source.width * scale),
      resizeHeight: Math.round(source.height * scale),
      resizeQuality: "high",
    });
  } finally {
    source.close();
  }
}

export default function ScanImageButton({
  preset,
  onScan,
}: IScanImageButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    let bitmap: ImageBitmap | undefined;

    try {
      bitmap = await createScanBitmap(file);
      const { BarcodeDetector } = await import("barcode-detector/ponyfill");
      const detector = new BarcodeDetector({ formats: ALL_SCAN_FORMATS });
      const detected = await detector.detect(bitmap);

      if (detected.length === 0) {
        toast.error("Kod nije pronađen na slici.");
        return;
      }

      const allowed = SCAN_FORMATS_BY_PRESET[preset];
      const match = detected.find((code) => allowed.includes(code.format));

      if (!match) {
        toast.error("Kod na slici nije barkod proizvoda (EAN).");
        return;
      }

      onScan({ rawValue: match.rawValue, format: match.format });
    } catch {
      toast.error("Sliku nije moguće učitati.");
    } finally {
      bitmap?.close();
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        icon={ImageUp}
        iconPlacement="left"
        loading={busy}
        loadingText="Učitavanje..."
        loadingIconPlacement="left"
        onClick={() => inputRef.current?.click()}
      >
        Učitaj sliku s kodom
      </Button>

      {/* The visible button is the real control. sr-only keeps this rendered and
          focusable, so tabbing landed on an unnamed file input that opened a
          second picker. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </>
  );
}
