"use client";

import { useEffect, useMemo, useRef } from "react";
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

function getVideoTrack(container: HTMLElement | null) {
  const video = container?.querySelector("video");
  const stream = (video?.srcObject as MediaStream | null) ?? null;

  return stream?.getVideoTracks()[0] ?? null;
}

function turnTorchOff(track: MediaStreamTrack | null) {
  track
    ?.applyConstraints({
      advanced: [{ torch: false } as MediaTrackConstraintSet],
    })
    .catch(() => {});
}

export default function CameraView({
  preset,
  deviceId,
  onScan,
  onError,
}: ICameraViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const constraints = useMemo(
    () => (deviceId ? { deviceId } : { facingMode: "environment" as const }),
    [deviceId],
  );

  // Some devices remember the torch state across streams; force it off on
  // every camera start so the flash never comes on by itself.
  useEffect(() => {
    const container = containerRef.current;

    const timer = window.setInterval(() => {
      const track = getVideoTrack(container);
      if (!track) return;

      window.clearInterval(timer);
      turnTorchOff(track);
    }, 300);

    return () => {
      window.clearInterval(timer);
      turnTorchOff(getVideoTrack(container));
    };
  }, [deviceId]);

  return (
    <div
      ref={containerRef}
      className="scanner-finder-recolor relative overflow-hidden rounded-xl bg-black"
    >
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
        components={{
          finder: true,
          torch: true,
          zoom: true,
          // onOff: true,
        }}
      />
    </div>
  );
}
