"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScanBarcode, AlertTriangle } from "lucide-react";
import { IScannedCode } from "@/typings/scanned-code";

interface ICodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export default function CameraScanner({
  isOpen,
  onClose,
  onScan,
}: ICodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const disableTorch = useCallback(
    async (track?: MediaStreamTrack | null) => {
      const t = track ?? videoTrack;
      if (!t) return;
      try {
        // Attempt to force-disable torch if supported
        // Some browsers require advanced constraints
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - torch is not in standard TS lib types
        await t.applyConstraints({ advanced: [{ torch: false }] });
      } catch {
        // ignore
      }
    },
    [videoTrack]
  );

  // Check camera permission by requesting basic video access
  const checkCameraPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setHasPermission(true);
      setError(null);
    } catch {
      setHasPermission(false);
      setError(
        "Potreban je pristup kameri za skeniranje. Molimo omogućite pristup kameri u postavkama preglednika."
      );
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkCameraPermission();
    }
  }, [isOpen, checkCameraPermission]);

  // Try to capture the underlying video track from the rendered Scanner's video element
  useEffect(() => {
    if (!isOpen || hasPermission !== true) return;
    const el = containerRef.current;
    if (!el) return;

    const tryGrab = () => {
      const video = el.querySelector("video") as HTMLVideoElement | null;
      const stream = (video?.srcObject as MediaStream | null) ?? null;
      const track = stream?.getVideoTracks?.()[0] ?? null;
      if (track) setVideoTrack(track);
    };
    // Run now and after a tick to cover delayed mount
    tryGrab();
    const id = window.setTimeout(tryGrab, 150);
    return () => window.clearTimeout(id);
  }, [isOpen, hasPermission]);

  const handleScan = useCallback(
    (detectedCodes: IScannedCode[]) => {
      if (detectedCodes && detectedCodes.length > 0) {
        const result = detectedCodes[0].rawValue;

        // Proactively turn off torch before closing via parent
        disableTorch();
        onScan(result);
      }
    },
    [onScan, disableTorch]
  );

  const handleError = useCallback(() => {
    setError("Greška pri skeniranju. Molimo pokušajte ponovno.");
  }, []);

  function handleClose() {
    setError(null);
    setHasPermission(null);
    // Ensure torch is disabled and stop track if present
    if (videoTrack) {
      disableTorch(videoTrack);
      try {
        videoTrack.stop();
      } catch {}
      setVideoTrack(null);
    }
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="size-6" />
            <span>Skeniraj kod</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4" ref={containerRef}>
          {error && (
            <div className="relative w-full rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div className="text-sm">{error}</div>
              </div>
            </div>
          )}

          {hasPermission === null && !error && (
            <div className="relative w-full rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div className="text-sm">Provjeravam pristup kameri...</div>
              </div>
            </div>
          )}

          {hasPermission === true && (
            <div className="relative">
              <div className="bg-black rounded-lg overflow-hidden">
                <Scanner
                  onScan={handleScan}
                  onError={handleError}
                  formats={[
                    "qr_code",
                    "aztec",
                    "codabar",
                    "code_39",
                    "code_93",
                    "code_128",
                    "data_matrix",
                    "ean_8",
                    "ean_13",
                    "itf",
                    "pdf417",
                    "upc_a",
                    "upc_e",
                  ]}
                  constraints={{
                    facingMode: "rear",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  }}
                  scanDelay={100}
                />
              </div>

              <div className="absolute inset-0 pointer-events-none">
                {/* Scanning overlay */}
                <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-70"></div>

                {/* Instructions */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black bg-opacity-70 text-white text-sm px-3 py-2 rounded text-center">
                    Usmjeri kameru prema kodu
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
