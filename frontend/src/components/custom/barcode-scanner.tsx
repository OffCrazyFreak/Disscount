"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ScanBarcode, AlertTriangle, FlashlightIcon } from "lucide-react";

interface IDetectedBarcode {
  rawValue: string;
  format?: string;
}

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export default function BarcodeScanner({
  isOpen,
  onClose,
  onScan,
}: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);

  // Check camera permissions when component mounts
  useEffect(() => {
    if (isOpen) {
      checkCameraPermission();
    }
  }, [isOpen]);

  async function checkCameraPermission() {
    try {
      // Check if we can access the camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      // Check torch support
      const track = stream.getVideoTracks()[0];
      setVideoTrack(track);

      if (track && "getCapabilities" in track) {
        const capabilities = track.getCapabilities() as any;
        setTorchSupported(Boolean(capabilities?.torch));
      }

      stream.getTracks().forEach((track) => track.stop()); // Stop the stream immediately
      setHasPermission(true);
      setError(null);
    } catch (err) {
      setHasPermission(false);
      setError(
        "Potreban je pristup kameri za skeniranje. Molimo omogućite pristup kameri u postavkama preglednika."
      );
    }
  }

  const handleScan = useCallback(
    (detectedCodes: IDetectedBarcode[]) => {
      if (detectedCodes && detectedCodes.length > 0) {
        const result = detectedCodes[0].rawValue;
        onScan(result);
      }
    },
    [onScan]
  );

  const handleError = useCallback((error: unknown) => {
    setError("Greška pri skeniranju. Molimo pokušajte ponovno.");
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!videoTrack || !torchSupported) return;

    const newTorchState = !torchEnabled;
    await videoTrack.applyConstraints({
      advanced: [{ torch: newTorchState } as any],
    });
    setTorchEnabled(newTorchState);
  }, [videoTrack, torchSupported, torchEnabled]);

  function handleClose() {
    setError(null);
    setHasPermission(null);
    setTorchEnabled(false);
    setTorchSupported(false);
    setVideoTrack(null);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="size-6" />

            <p>Skeniraj kod</p>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="relative w-full rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <div className="text-sm">{error}</div>
              </div>
            </div>
          )}

          {hasPermission === false && !error && (
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
                    facingMode: "environment", // Use back camera by default
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  }}
                  scanDelay={300}
                />
              </div>

              <div className="absolute inset-0 pointer-events-none">
                {/* Scanning overlay */}
                <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-70"></div>

                {/* Torch button */}
                {torchSupported && (
                  <div className="absolute top-4 right-4 pointer-events-auto">
                    <Button
                      onClick={toggleTorch}
                      variant="ghost"
                      size="sm"
                      className={`p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 ${
                        torchEnabled ? "text-yellow-400" : "text-white"
                      }`}
                      title={
                        torchEnabled
                          ? "Isključi bljeskalicu"
                          : "Uključi bljeskalicu"
                      }
                    >
                      <FlashlightIcon className="size-5" />
                    </Button>
                  </div>
                )}

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
