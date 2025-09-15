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
import { ScanBarcode, AlertTriangle, FlashlightIcon } from "lucide-react";
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
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [videoTrack, setVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [cameraDeviceId, setCameraDeviceId] = useState<string | undefined>();

  // Check camera permissions when component mounts
  useEffect(() => {
    if (isOpen) {
      checkCameraPermission();
    }
  }, [isOpen]);

  // Try to pick the most likely "main" back camera from available devices
  function pickMainBackCamera(devices: MediaDeviceInfo[]): string | undefined {
    const videoInputs = devices.filter((d) => d.kind === "videoinput");
    if (videoInputs.length === 0) return undefined;

    // Prefer labels that look like back/rear environment
    const backish = videoInputs.filter((d) =>
      /back|rear|environment/i.test(d.label)
    );

    // Among back cameras, prefer ones that look like the "main" wide camera
    const mainPreferred = backish.find((d) =>
      /wide(?!\s*macro|\s*ultra)|standard|main/i.test(d.label)
    );
    if (mainPreferred) return mainPreferred.deviceId;

    if (backish.length > 0) return backish[0].deviceId;

    // Fallback to the first available camera
    return videoInputs[0]?.deviceId;
  }

  async function checkCameraPermission() {
    try {
      // 1) Request a provisional stream to unlock device labels and prefer back camera
      let provisionalStream: MediaStream | null = null;
      try {
        provisionalStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
      } catch {
        // Fallback: request any camera just to get permission
        provisionalStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }

      // 2) Enumerate devices and pick the most likely main back camera
      const devices = await navigator.mediaDevices.enumerateDevices();
      const preferredId = pickMainBackCamera(devices);

      // 3) Close provisional tracks before opening the final one
      provisionalStream?.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {}
      });

      // 4) Open the final stream using the chosen device (or fallback to environment)
      const finalStream = await navigator.mediaDevices.getUserMedia({
        video: preferredId
          ? { deviceId: { exact: preferredId } }
          : { facingMode: { ideal: "environment" } },
      });

      // Check torch support
      const track = finalStream.getVideoTracks()[0];
      setVideoTrack(track);

      if (track && "getCapabilities" in track) {
        const capabilities = track.getCapabilities() as any;
        setTorchSupported(Boolean(capabilities?.torch));
      }

      const settings = track.getSettings();
      setCameraDeviceId(settings.deviceId);

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
    (detectedCodes: IScannedCode[]) => {
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
    if (videoTrack) {
      try {
        videoTrack.stop();
      } catch {}
    }
    setVideoTrack(null);
    setCameraDeviceId(undefined);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="">
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
                    // Prefer the same device to keep torch control in sync
                    ...(cameraDeviceId
                      ? { deviceId: { exact: cameraDeviceId } }
                      : { facingMode: "environment" }), // use back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                  }}
                  scanDelay={300}
                />
              </div>

              <div className="absolute inset-0 pointer-events-none">
                {/* Scanning overlay */}
                <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-70"></div>

                {/* Torch button TODO */}
                {/* {torchSupported && (
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
                )} */}

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
