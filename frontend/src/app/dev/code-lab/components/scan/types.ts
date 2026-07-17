export type ScanEngine = "yudiel" | "modern" | "html5";

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
}

export interface IScannerProps {
  settings: IScannerSettings;
  onDetect: (value: string, format: string) => void;
}

export const SCAN_ENGINES: { id: ScanEngine; label: string; note: string }[] = [
  { id: "yudiel", label: "react-qr-scanner", note: "current app scanner, v2.6" },
  { id: "modern", label: "modern-barcode-scanner", note: "ZBar WASM in a worker" },
  { id: "html5", label: "html5-qrcode", note: "unmaintained since 2023" },
];
