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

type CameraScannerCallback = (result: string) => void;

interface ICameraScannerContext {
  openScanner: (cb?: CameraScannerCallback) => void;
  closeScanner: () => void;
}

const CameraScannerContext = createContext<ICameraScannerContext | null>(null);

export function CameraScannerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const cbRef = useRef<CameraScannerCallback | undefined>(undefined);

  const openScanner = useCallback((callback?: CameraScannerCallback) => {
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
    <CameraScannerContext.Provider value={value}>
      {children}
      <CameraScanner
        isOpen={isOpen}
        onClose={closeScanner}
        onScan={handleScan}
      />
    </CameraScannerContext.Provider>
  );
}

export function useCameraScanner() {
  const ctx = useContext(CameraScannerContext);
  if (!ctx)
    throw new Error(
      "useCameraScanner must be used within CameraScannerProvider"
    );
  return ctx;
}
