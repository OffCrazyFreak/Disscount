"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ALL_SCAN_FORMATS, SCAN_FORMATS_BY_PRESET } from "@/constants/scanner";
import { IScannedCode, ScanPreset } from "@/typings/scanned-code";
import { hasValidCheckDigit } from "@/utils/barcode/check-digits";
import { normalizeScannedCode } from "@/utils/barcode/normalize-code";

const MAX_SCAN_IMAGE_DIMENSION = 2048;

interface IScanImageButtonProps {
  preset: ScanPreset;
  onCodes: (codes: IScannedCode[]) => void;
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
  onCodes,
}: IScanImageButtonProps) {
  const t = useTranslations("scanner");
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
        toast.error(t("image.notFound"));
        return;
      }

      const allowed = SCAN_FORMATS_BY_PRESET[preset];
      const inPreset = detected.filter((code) => allowed.includes(code.format));

      if (inPreset.length === 0) {
        toast.error(
          preset === "product"
            ? "Kod na slici nije barkod proizvoda (EAN)."
            : "Format koda na slici nije podržan.",
        );
        return;
      }

      const seen = new Set<string>();
      const valid = inPreset
        .map((code) => {
          const scanned = {
            rawValue: code.rawValue.trim(),
            format: code.format,
          };
          // Same rule as the camera path: only cards store the normalised form.
          return preset === "all" ? normalizeScannedCode(scanned) : scanned;
        })
        .filter((code) => hasValidCheckDigit(code.rawValue, code.format ?? ""))
        .filter((code) => {
          const key = `${code.format}:${code.rawValue}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      if (valid.length === 0) {
        toast.error(
          "Kod na slici nije pročitan ispravno. Probaj s oštrijom slikom.",
        );
        return;
      }

      onCodes(valid);
    } catch {
      toast.error(t("image.loadFailed"));
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
        loadingText={t("image.loading")}
        loadingIconPlacement="left"
        onClick={() => inputRef.current?.click()}
      >
        {t("image.upload")}
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
