"use client";

import { useEffect, useRef } from "react";
import {
  BarcodeScanner,
  type BarcodeScannerRef,
  type ScanResult,
} from "modern-barcode-scanner";
import "modern-barcode-scanner/styles.css";
import { IScannerProps } from "../types";

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
    <div className="relative h-96 overflow-hidden rounded-xl bg-black">
      <BarcodeScanner
        ref={scannerRef}
        onScan={handleScan}
        themeColor="#16a34a"
        scanInterval={Math.max(settings.scanDelay, 100)}
        enableVibration={false}
        enableSound={settings.sound}
        initialFacingMode="environment"
      />
    </div>
  );
}
