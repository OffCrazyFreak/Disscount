"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useMemo,
  useRef,
} from "react";
import CameraScanner from "@/components/custom/camera-scanner";

type ScannerCallback = (result: string) => void;

interface IScannerContext {
  openScanner: (cb?: ScannerCallback) => void;
  closeScanner: () => void;
}

const ScannerContext = createContext<IScannerContext | null>(null);

export function CameraScannerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const cbRef = useRef<ScannerCallback | undefined>(undefined);

  const openScanner = useCallback((callback?: ScannerCallback) => {
    cbRef.current = callback;
    setIsOpen(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsOpen(false);
    cbRef.current = undefined;
  }, []);

  const handleScan = useCallback(
    (result: string) => {
      const cb = cbRef.current;
      if (cb) cb(result);
      closeScanner();
    },
    [closeScanner]
  );

  const value = useMemo(
    () => ({ openScanner, closeScanner }),
    [openScanner, closeScanner]
  );
  return (
    <ScannerContext.Provider value={value}>
      {children}
      <CameraScanner
        isOpen={isOpen}
        onClose={closeScanner}
        onScan={handleScan}
      />
    </ScannerContext.Provider>
  );
}

export function useCameraScanner() {
  const ctx = useContext(ScannerContext);
  if (!ctx) throw new Error("useScanner must be used within ScannerProvider");
  return ctx;
}
