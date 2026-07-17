"use client";

import { useEffect, useRef } from "react";
import {
  BarcodeScanner,
  type BarcodeScannerRef,
  type ScanResult,
} from "modern-barcode-scanner";
import "modern-barcode-scanner/styles.css";
import { SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScanOverlay from "../scan-overlay";
import { IScannerProps, LAB_PRIMARY } from "../types";

export default function ModernScanner({ settings, onDetect }: IScannerProps) {
  const scannerRef = useRef<BarcodeScannerRef>(null);

  useEffect(() => {
    const scanner = scannerRef.current;
    scanner?.start();

    return () => scanner?.stop();
  }, []);

  function handleScan(result: ScanResult) {
    onDetect(result.scanData, result.typeName);

    if (settings.allowMultiple) scannerRef.current?.start();
  }

  return (
    <div className="space-y-3">
      <div className="relative h-96 overflow-hidden rounded-xl bg-black">
        <ScanOverlay />
        <BarcodeScanner
          ref={scannerRef}
          onScan={handleScan}
          themeColor={LAB_PRIMARY}
          scanInterval={Math.max(settings.scanDelay, 100)}
          enableVibration={false}
          enableSound={settings.sound}
          initialFacingMode="environment"
          showScanLine
          showTorchButton
          showCameraSwitch
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => scannerRef.current?.switchCamera()}
        >
          <SwitchCamera /> Flip camera
        </Button>
        <p className="text-xs text-muted-foreground">
          This library only flips front/back; it cannot pick a specific camera
          device.
        </p>
      </div>
    </div>
  );
}
