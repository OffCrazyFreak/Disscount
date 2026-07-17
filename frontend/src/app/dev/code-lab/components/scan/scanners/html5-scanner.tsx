"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { TriangleAlert } from "lucide-react";
import { IScannerProps } from "../types";

const CONTAINER_ID = "code-lab-html5-scanner";

const FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.AZTEC,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.PDF_417,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
];

async function stopScanner(scanner: Html5Qrcode) {
  try {
    await scanner.stop();
    scanner.clear();
  } catch {}
}

export default function Html5Scanner({ onDetect }: IScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const onDetectRef = useRef(onDetect);

  useEffect(() => {
    onDetectRef.current = onDetect;
  }, [onDetect]);

  useEffect(() => {
    let active = true;
    const scanner = new Html5Qrcode(CONTAINER_ID, {
      formatsToSupport: FORMATS,
      verbose: false,
    });

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        (decodedText, result) => {
          onDetectRef.current(
            decodedText,
            result.result.format?.formatName ?? "unknown",
          );
        },
        undefined,
      )
      .then(() => {
        if (!active) stopScanner(scanner);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      active = false;
      if (scanner.isScanning) stopScanner(scanner);
    };
  }, []);

  return (
    <div className="space-y-3">
      {error && (
        <p className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 font-mono text-xs text-destructive">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div
        id={CONTAINER_ID}
        className="overflow-hidden rounded-xl bg-black [&_video]:w-full"
      />

      <p className="text-xs text-muted-foreground">
        html5-qrcode has been unmaintained since 2023 and is included here for
        comparison only.
      </p>
    </div>
  );
}
