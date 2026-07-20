"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import CameraScanner from "@/components/scanner/camera-scanner";
import { IScannedCode, ScanPreset } from "@/typings/scanned-code";

interface IOpenScannerOptions {
  onScan: (code: IScannedCode) => void;
  preset?: ScanPreset;
}

interface ICameraScannerContext {
  openScanner: (options: IOpenScannerOptions) => void;
  closeScanner: () => void;
}

const CameraScannerContext = createContext<ICameraScannerContext | null>(null);

export function CameraScannerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [preset, setPreset] = useState<ScanPreset>("product");
  const onScanRef = useRef<IOpenScannerOptions["onScan"] | undefined>(
    undefined,
  );

  const openScanner = useCallback((options: IOpenScannerOptions) => {
    onScanRef.current = options.onScan;
    setPreset(options.preset ?? "product");
    setIsOpen(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsOpen(false);
    onScanRef.current = undefined;
  }, []);

  const handleScan = useCallback(
    (code: IScannedCode) => {
      if (!code.rawValue?.trim()) return;

      navigator.vibrate?.(80);
      onScanRef.current?.(code);
      closeScanner();
    },
    [closeScanner],
  );

  const value = useMemo(
    () => ({ openScanner, closeScanner }),
    [openScanner, closeScanner],
  );

  return (
    <CameraScannerContext.Provider value={value}>
      {children}
      <CameraScanner
        isOpen={isOpen}
        preset={preset}
        onClose={closeScanner}
        onScan={handleScan}
      />
    </CameraScannerContext.Provider>
  );
}

export function useCameraScanner() {
  const ctx = useContext(CameraScannerContext);
  if (!ctx) {
    throw new Error(
      "useCameraScanner must be used within CameraScannerProvider",
    );
  }

  return ctx;
}
