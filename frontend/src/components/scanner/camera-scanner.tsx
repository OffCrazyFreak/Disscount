"use client";

import { useState } from "react";
import { ScanBarcode, TriangleAlert } from "lucide-react";
import { useDevices } from "@yudiel/react-qr-scanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  clearPreferredCamera,
  getPreferredCamera,
  setPreferredCamera,
} from "@/utils/browser/local-storage";
import { describeScannerError, pickBackCamera } from "@/utils/browser/camera";
import { IScannedCode, ScanPreset } from "@/typings/scanned-code";
import CameraView from "@/components/scanner/camera-view";
import CameraSelect from "@/components/scanner/camera-select";
import ScanImageButton from "@/components/scanner/scan-image";

interface ICameraScannerProps {
  isOpen: boolean;
  preset: ScanPreset;
  onClose: () => void;
  onScan: (code: IScannedCode) => void;
}

export default function CameraScanner({
  isOpen,
  preset,
  onClose,
  onScan,
}: ICameraScannerProps) {
  const devices = useDevices();
  const [manualDeviceId, setManualDeviceId] = useState<string | undefined>(() =>
    getPreferredCamera(),
  );
  const [error, setError] = useState<string | null>(null);

  const activeDeviceId = manualDeviceId ?? pickBackCamera(devices) ?? undefined;

  function handleSelect(deviceId: string) {
    setManualDeviceId(deviceId);
    setPreferredCamera(deviceId);
    setError(null);
  }

  function handleReset() {
    setManualDeviceId(undefined);
    clearPreferredCamera();
    setError(null);
  }

  function handleClose() {
    setError(null);
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="size-6" />
            Skeniraj kod
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <p className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          ) : (
            <CameraView
              preset={preset}
              deviceId={activeDeviceId}
              onScan={onScan}
              onError={(err) => setError(describeScannerError(err))}
            />
          )}

          {devices.length > 1 && (
            <CameraSelect
              devices={devices}
              value={activeDeviceId}
              hasManualChoice={Boolean(manualDeviceId)}
              onSelect={handleSelect}
              onReset={handleReset}
            />
          )}

          <ScanImageButton preset={preset} onScan={onScan} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
