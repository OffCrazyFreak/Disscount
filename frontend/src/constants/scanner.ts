import type { BarcodeFormat } from "barcode-detector";
import { ScanPreset } from "@/typings/scanned-code";

// The scanner and BarcodeDetector share format names, so one list drives both.
export const PRODUCT_SCAN_FORMATS: BarcodeFormat[] = [
  "ean_8",
  "ean_13",
  "upc_a",
  "upc_e",
];

export const ALL_SCAN_FORMATS: BarcodeFormat[] = [
  ...PRODUCT_SCAN_FORMATS,
  "qr_code",
  "aztec",
  "codabar",
  "code_39",
  "code_93",
  "code_128",
  "data_matrix",
  "itf",
  "pdf417",
];

export const SCAN_FORMATS_BY_PRESET: Record<ScanPreset, BarcodeFormat[]> = {
  product: PRODUCT_SCAN_FORMATS,
  all: ALL_SCAN_FORMATS,
};
