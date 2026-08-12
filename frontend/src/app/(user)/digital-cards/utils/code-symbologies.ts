import { CODE_TYPES, type CodeType } from "@/constants/card-codes";

/**
 * Barcode Detection API format name to the bwip-js encoder name. The scanner speaks the
 * former and bwip-js the latter, so this map is the only place the two vocabularies meet.
 */
export const CODE_TYPE_TO_BCID: Record<Exclude<CodeType, "unknown">, string> = {
  ean_13: "ean13",
  ean_8: "ean8",
  upc_a: "upca",
  upc_e: "upce",
  code_128: "code128",
  code_39: "code39",
  code_93: "code93",
  itf: "interleaved2of5",
  codabar: "codabar",
  qr_code: "qrcode",
  data_matrix: "datamatrix",
  pdf417: "pdf417",
  aztec: "azteccode",
};

const CODE_TYPE_LABELS: Record<CodeType, string> = {
  ean_13: "EAN-13",
  ean_8: "EAN-8",
  upc_a: "UPC-A",
  upc_e: "UPC-E",
  code_128: "Code 128",
  code_39: "Code 39",
  code_93: "Code 93",
  itf: "ITF (Interleaved 2 of 5)",
  codabar: "Codabar",
  qr_code: "QR kod",
  data_matrix: "Data Matrix",
  pdf417: "PDF417",
  aztec: "Aztec",
  unknown: "Samo broj/tekst",
};

// The handful worth surfacing first: what Croatian loyalty cards actually carry.
const COMMON_CODE_TYPES: CodeType[] = [
  "ean_13",
  "ean_8",
  "code_128",
  "code_39",
  "qr_code",
  "upc_a",
];

export function getCodeTypeLabel(codeType: CodeType): string {
  return CODE_TYPE_LABELS[codeType];
}

export interface ICodeTypeGroup {
  label: string;
  options: { value: CodeType; label: string }[];
}

/**
 * One grouped list rather than a curated subset, so a scan that returns an unusual
 * format still has a matching option instead of being silently dropped.
 */
export function getCodeTypeGroups(): ICodeTypeGroup[] {
  const rest = CODE_TYPES.filter((type) => !COMMON_CODE_TYPES.includes(type));

  return [
    {
      label: "Uobičajeni",
      options: COMMON_CODE_TYPES.map((value) => ({
        value,
        label: CODE_TYPE_LABELS[value],
      })),
    },
    {
      label: "Ostali",
      options: rest.map((value) => ({
        value,
        label: CODE_TYPE_LABELS[value],
      })),
    },
  ];
}

/** Narrows an arbitrary scanner format string onto our stored vocabulary. */
export function toCodeType(format: string | undefined): CodeType {
  if (!format) return "unknown";

  return (CODE_TYPES as readonly string[]).includes(format)
    ? (format as CodeType)
    : "unknown";
}
