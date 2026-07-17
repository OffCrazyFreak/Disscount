export interface IScannedCode {
  rawValue: string;
  format?: string;
}

// Which barcode families a scanner invocation accepts; products are locked to EAN.
export type ScanPreset = "product" | "all";
