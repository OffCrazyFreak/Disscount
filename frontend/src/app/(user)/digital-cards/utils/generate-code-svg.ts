import {
  drawingSVG,
  ean13,
  ean8,
  upca,
  upce,
  code128,
  code39,
  code93,
  interleaved2of5,
  rationalizedCodabar,
  qrcode,
  datamatrix,
  pdf417,
  azteccode,
  type RenderOptions,
} from "@bwip-js/browser";

import type { CodeType } from "@/constants/card-codes";
import { CODE_TYPE_TO_BCID } from "@/app/(user)/digital-cards/utils/code-symbologies";

type Encoder = (opts: RenderOptions, drawing: unknown) => string;

// Named imports do NOT tree-shake: BWIPP is one generated blob, so any single encoder pulls
// the whole table (measured at 844 KB raw, 210 KB gzipped). Webpack keeps that in the
// digital-cards route chunk rather than a shared one, so no other page pays for it.
// Kept synchronous on purpose: every card tile renders a code, so a lazy import would only
// move the same download behind a loading state.
const ENCODERS: Record<Exclude<CodeType, "unknown">, Encoder> = {
  ean_13: ean13 as Encoder,
  ean_8: ean8 as Encoder,
  upc_a: upca as Encoder,
  upc_e: upce as Encoder,
  code_128: code128 as Encoder,
  code_39: code39 as Encoder,
  code_93: code93 as Encoder,
  itf: interleaved2of5 as Encoder,
  codabar: rationalizedCodabar as Encoder,
  qr_code: qrcode as Encoder,
  data_matrix: datamatrix as Encoder,
  pdf417: pdf417 as Encoder,
  aztec: azteccode as Encoder,
};

export type CodeSvgResult =
  { ok: true; svg: string } | { ok: false; reason: "unsupported" | "invalid" };

const TWO_DIMENSIONAL: CodeType[] = [
  "qr_code",
  "data_matrix",
  "pdf417",
  "aztec",
];

export function isTwoDimensional(codeType: CodeType): boolean {
  return TWO_DIMENSIONAL.includes(codeType);
}

/**
 * Never throws: bwip-js rejects a value that does not fit its symbology (an EAN-13 needs
 * twelve digits), and the caller renders the plain value instead of a broken code.
 */
export function generateCodeSvg(
  codeValue: string,
  codeType: CodeType,
): CodeSvgResult {
  if (codeType === "unknown") return { ok: false, reason: "unsupported" };

  const value = codeValue.trim();
  if (!value) return { ok: false, reason: "invalid" };

  try {
    // includetext stays off so the human-readable line is our own HTML: it keeps user
    // input out of the SVG string that the code panel injects.
    const options: RenderOptions = {
      bcid: CODE_TYPE_TO_BCID[codeType],
      text: value,
      includetext: false,
      scale: 3,
      paddingwidth: 0,
      paddingheight: 0,
    };

    // A 2D symbology sizes itself; height on a 1D one is the bar height in millimetres.
    if (!isTwoDimensional(codeType)) options.height = 14;

    const svg = ENCODERS[codeType](options, drawingSVG());

    return { ok: true, svg };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
