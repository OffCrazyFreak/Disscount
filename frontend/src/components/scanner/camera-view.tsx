"use client";

import { useMemo } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { SCAN_FORMATS_BY_PRESET } from "@/constants/scanner";
import { IScannedCode, ScanPreset } from "@/typings/scanned-code";
import ScanOverlay from "@/components/scanner/scan-overlay";
import "@/components/scanner/scanner.css";

interface ICameraViewProps {
  preset: ScanPreset;
  deviceId?: string;
  onScan: (code: IScannedCode) => void;
  onError: (error: unknown) => void;
}

export default function CameraView({
  preset,
  deviceId,
  onScan,
  onError,
}: ICameraViewProps) {
  const constraints = useMemo(
    () =>
      deviceId ? { deviceId } : { facingMode: "environment" as const },
    [deviceId],
  );

  return (
    <div className="scanner-finder-recolor relative overflow-hidden rounded-xl bg-black">
      <ScanOverlay />

      <Scanner
        onScan={(codes) => {
          if (codes[0]) {
            onScan({ rawValue: codes[0].rawValue, format: codes[0].format });
          }
        }}
        onError={onError}
        formats={SCAN_FORMATS_BY_PRESET[preset]}
        constraints={constraints}
        scanDelay={150}
        sound
        components={{ finder: true, torch: true, zoom: true, onOff: true }}
      />
    </div>
  );
}
