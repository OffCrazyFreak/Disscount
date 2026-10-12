import {
  azteccode,
  code128,
  code39,
  code93,
  datamatrix,
  drawingSVG,
  ean13,
  ean8,
  interleaved2of5,
  pdf417,
  qrcode,
  rationalizedCodabar,
  upca,
  upce,
} from "@bwip-js/browser";
import type { DrawingContext, RenderOptions } from "@bwip-js/browser";

import { toEightDigitUpcE } from "@/utils/barcode/upc-e";
import {
  TWO_DIMENSIONAL_CODE_TYPES,
  type CodeType,
} from "@/constants/card-codes";

type Encoder = (
  options: RenderOptions,
  drawing: DrawingContext<string>,
) => string;

interface IEncoderSpec {
  encode: Encoder;
  // Digits only, with the exact length the symbology prints; bwip would otherwise pad a
  // check digit on, and the drawn code would no longer match the stored number.
  accepts?: RegExp;
  // Output units bwip spends per module at scale 1: its matrix codes use 2.
  unit: number;
  // Quiet zone in output units, left and right only for linear codes.
  padding: number;
}

const LINEAR_BAR_HEIGHT_MM = 16;

const SPECS: Partial<Record<CodeType, IEncoderSpec>> = {
  ean_13: {
    encode: ean13,
    accepts: /^\d{13}$/,
    unit: 1,
    padding: 10,
  },
  ean_8: { encode: ean8, accepts: /^\d{8}$/, unit: 1, padding: 10 },
  upc_a: { encode: upca, accepts: /^\d{12}$/, unit: 1, padding: 10 },
  upc_e: { encode: upce, accepts: /^\d{8}$/, unit: 1, padding: 10 },
  code_128: { encode: code128, unit: 1, padding: 10 },
  code_39: { encode: code39, unit: 1, padding: 10 },
  code_93: { encode: code93, unit: 1, padding: 10 },
  codabar: { encode: rationalizedCodabar, unit: 1, padding: 10 },
  itf: {
    encode: interleaved2of5,
    accepts: /^(\d\d)+$/,
    unit: 1,
    padding: 10,
  },
  qr_code: { encode: qrcode, unit: 2, padding: 8 },
  aztec: { encode: azteccode, unit: 2, padding: 4 },
  data_matrix: { encode: datamatrix, unit: 2, padding: 4 },
  pdf417: { encode: pdf417, unit: 1, padding: 4 },
};

export type CodeSvgResult =
  { ok: true; svg: string; twoDimensional: boolean } | { ok: false };

const SVG_SHAPE = /^<svg viewBox="0 0 (\d+) (\d+)"[^>]*>([\s\S]*)<\/svg>\s*$/;

export function generateCodeSvg(
  value: string,
  codeType: CodeType,
): CodeSvgResult {
  const spec = SPECS[codeType];
  if (!spec || !value) return { ok: false };

  // Cards saved before scans were normalized may still hold the six or seven digit form.
  const text =
    codeType === "upc_e" ? (toEightDigitUpcE(value) ?? value) : value;
  if (spec.accepts && !spec.accepts.test(text)) return { ok: false };

  const twoDimensional = TWO_DIMENSIONAL_CODE_TYPES.includes(codeType);

  try {
    const raw = spec.encode(
      {
        // Required by the type, ignored by the named encoders.
        bcid: codeType,
        text,
        scale: 1,
        includetext: false,
        paddingwidth: spec.padding,
        paddingheight: twoDimensional ? spec.padding : 0,
        // Matrix codes are square by definition; a height would stretch them.
        ...(!twoDimensional ? { height: LINEAR_BAR_HEIGHT_MM } : {}),
      },
      drawingSVG(),
    );

    const parts = SVG_SHAPE.exec(raw);
    if (!parts) return { ok: false };

    const width = Number(parts[1]) / spec.unit;
    const height = Number(parts[2]) / spec.unit;
    const scaled =
      spec.unit === 1
        ? parts[3]
        : `<g transform="scale(${1 / spec.unit})">${parts[3]}</g>`;

    // The white rect keeps the quiet zone white on a dark page.
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
      `shape-rendering="crispEdges"><rect width="${width}" height="${height}" fill="#ffffff"/>` +
      `${scaled}</svg>`;

    return { ok: true, svg, twoDimensional };
  } catch {
    return { ok: false };
  }
}
