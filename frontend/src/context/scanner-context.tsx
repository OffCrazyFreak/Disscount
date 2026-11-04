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
  confirm?: boolean;
  /** The control that was clicked. Safari does not focus a button on click, so activeElement cannot name it. */
  opener?: HTMLElement | null;
}

interface ICameraScannerContext {
  openScanner: (options: IOpenScannerOptions) => void;
  closeScanner: () => void;
}

const CameraScannerContext = createContext<ICameraScannerContext | null>(null);

interface ICameraScannerProviderProps {
  children: ReactNode;
}

export function CameraScannerProvider({
  children,
}: ICameraScannerProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [preset, setPreset] = useState<ScanPreset>("product");
  const [confirm, setConfirm] = useState(false);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const onScanRef = useRef<IOpenScannerOptions["onScan"] | undefined>(
    undefined,
  );

  const openScanner = useCallback((options: IOpenScannerOptions) => {
    onScanRef.current = options.onScan;
    setPreset(options.preset ?? "product");
    setConfirm(options.confirm ?? false);
    setOpener(options.opener ?? null);
    setIsOpen(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsOpen(false);
    onScanRef.current = undefined;
  }, []);

  const handleScan = useCallback(
    (code: IScannedCode) => {
      if (!code.rawValue?.trim()) return;

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
        confirm={confirm}
        opener={opener}
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
