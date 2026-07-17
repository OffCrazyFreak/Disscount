"use client";

import { useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ALL_SCAN_FORMATS, SCAN_FORMATS_BY_PRESET } from "@/constants/scanner";
import { IScannedCode, ScanPreset } from "@/typings/scanned-code";

interface IScanImageButtonProps {
  preset: ScanPreset;
  onScan: (code: IScannedCode) => void;
}

export default function ScanImageButton({
  preset,
  onScan,
}: IScanImageButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);

    try {
      const bitmap = await createImageBitmap(file);
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
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <ImageUp className="size-5" />
        {busy ? "Učitavanje..." : "Učitaj sliku s kodom"}
      </Button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </>
  );
}
