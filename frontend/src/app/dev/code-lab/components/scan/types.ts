export type ScanEngine = "yudiel" | "modern";

export const LAB_PRIMARY = "#2ec50c";

export interface IScanEntry {
  id: string;
  engine: ScanEngine;
  value: string;
  format: string;
  at: number;
  msToFirstDecode?: number;
}

export interface IScannerSettings {
  scanDelay: number;
  allowMultiple: boolean;
  sound: boolean;
  vibration: boolean;
  eanOnly: boolean;
}

export function isEanFamily(format: string): boolean {
  const normalized = format.toLowerCase().replace(/[-_\s]/g, "");

  return (
    normalized.startsWith("ean") ||
    normalized.startsWith("upc") ||
    normalized.startsWith("isbn")
  );
}

export interface IScannerProps {
  settings: IScannerSettings;
  onDetect: (value: string, format: string) => void;
}

export const SCAN_ENGINES: { id: ScanEngine; label: string; note: string }[] = [
  { id: "yudiel", label: "react-qr-scanner", note: "current app scanner, v2.6" },
  { id: "modern", label: "modern-barcode-scanner", note: "ZBar WASM in a worker" },
];
