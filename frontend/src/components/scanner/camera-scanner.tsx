"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import ScannerContent from "@/components/scanner/scanner-content";
import { IScannedCode, ScanPreset } from "@/typings/scanned-code";

interface ICameraScannerProps {
  isOpen: boolean;
  preset: ScanPreset;
  confirm: boolean;
  onClose: () => void;
  onScan: (code: IScannedCode) => void;
}

export default function CameraScanner({
  isOpen,
  preset,
  confirm,
  onClose,
  onScan,
}: ICameraScannerProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Content unmounts on close, so every open starts at the camera step. */}
      <DialogContent>
        <ScannerContent preset={preset} confirm={confirm} onScan={onScan} />
      </DialogContent>
    </Dialog>
  );
}
