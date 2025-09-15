"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import BarcodeScanner from "./barcode-scanner";

type ScanCallback = (result: string) => void;

interface ScannerContextValue {
  openScanner: (cb?: ScanCallback) => void;
  closeScanner: () => void;
}

const ScannerContext = createContext<ScannerContextValue | null>(null);

export function ScannerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cb, setCb] = useState<ScanCallback | undefined>(undefined);

  const openScanner = useCallback((callback?: ScanCallback) => {
    setCb(() => callback);
    setIsOpen(true);
  }, []);

  const closeScanner = useCallback(() => {
    setIsOpen(false);
    setCb(undefined);
  }, []);

  const handleScan = useCallback(
    (result: string) => {
      if (cb) cb(result);
      closeScanner();
    },
    [cb, closeScanner]
  );

  const value = useMemo(() => ({ openScanner, closeScanner }), [openScanner, closeScanner]);
  return (
    <ScannerContext.Provider value={value}>
      {children}
      <BarcodeScanner
        isOpen={isOpen}
        onClose={closeScanner}
        onScan={handleScan}
      />
    </ScannerContext.Provider>
  );
}

export function useScanner() {
  const ctx = useContext(ScannerContext);
  if (!ctx) throw new Error("useScanner must be used within ScannerProvider");
  return ctx;
}
