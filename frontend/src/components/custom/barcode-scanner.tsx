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
import { X, ScanBarcode, AlertTriangle } from "lucide-react";

interface IDetectedBarcode {
  rawValue: string;
  format?: string;
}

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
}

export default function BarcodeScanner({
  isOpen,
  onClose,
  onScan,
  title = "Skeniranje barkoda",
}: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Check camera permissions when component mounts
  useEffect(() => {
    if (isOpen) {
      checkCameraPermission();
    }
  }, [isOpen]);

  const checkCameraPermission = async () => {
    try {
      // Check if we can access the camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop()); // Stop the stream immediately
      setHasPermission(true);
      setError(null);
    } catch (err) {
      console.error("Camera permission error:", err);
      setHasPermission(false);
      setError(
        "Potreban je pristup kameri za skeniranje barkoda. Molimo omogućite pristup kameri u postavkama pregljednika."
      );
    }
  };

  const handleScan = useCallback(
    (detectedCodes: IDetectedBarcode[]) => {
      if (detectedCodes && detectedCodes.length > 0) {
        const result = detectedCodes[0].rawValue;
        console.log("Scanned result:", result);
        onScan(result);
        onClose();
      }
    },
    [onScan, onClose]
  );

  const handleError = useCallback((error: unknown) => {
    console.error("Scanner error:", error);
    setError("Greška pri skeniranju. Molimo pokušajte ponovno.");
  }, []);

  const handleClose = () => {
    setError(null);
    setHasPermission(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="size-5" />
            {title}
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
                  constraints={{
                    width: 400,
                    height: 300,
                    facingMode: "environment", // Use back camera by default
                  }}
                  scanDelay={300}
                  styles={{
                    container: {
                      width: "100%",
                      height: "300px",
                    },
                    video: {
                      width: "100%",
                      height: "300px",
                      objectFit: "cover",
                    },
                  }}
                />
              </div>

              <div className="absolute inset-0 pointer-events-none">
                {/* Scanning overlay */}
                <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-70"></div>

                {/* Instructions */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black bg-opacity-70 text-white text-sm px-3 py-2 rounded text-center">
                    Usmjerite kameru prema barkodu
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              <X className="size-4 mr-2" />
              Zatvori
            </Button>
            {hasPermission === false && (
              <Button onClick={checkCameraPermission}>Pokušaj ponovno</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
