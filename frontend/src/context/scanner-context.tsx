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
import dynamic from "next/dynamic";
import { prepareBeep } from "@/components/scanner/scan-beep";
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

// Lazy so the scanner library only downloads once someone opens the scanner.
const CameraScanner = dynamic(
  () => import("@/components/scanner/camera-scanner"),
  { ssr: false },
);

const CameraScannerContext = createContext<ICameraScannerContext | null>(null);

interface ICameraScannerProviderProps {
  children: ReactNode;
}

export function CameraScannerProvider({
  children,
}: ICameraScannerProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Stays true after the first open, so the dialog can still animate closed.
  const [hasOpened, setHasOpened] = useState(false);
  const [preset, setPreset] = useState<ScanPreset>("product");
  const [confirm, setConfirm] = useState(false);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const onScanRef = useRef<IOpenScannerOptions["onScan"] | undefined>(
    undefined,
  );

  const openScanner = useCallback((options: IOpenScannerOptions) => {
    // iOS only unlocks audio inside the tap, which is over before the lazy scanner loads.
    prepareBeep();

    onScanRef.current = options.onScan;
    setPreset(options.preset ?? "product");
    setConfirm(options.confirm ?? false);
    // Read focus at the tap: the lazy dialog can mount after focus has moved on.
    setOpener(
      options.opener ??
        (document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null),
    );
    setIsOpen(true);
    setHasOpened(true);
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
      {hasOpened && (
        <CameraScanner
          isOpen={isOpen}
          preset={preset}
          confirm={confirm}
          opener={opener}
          onClose={closeScanner}
          onScan={handleScan}
        />
      )}
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
