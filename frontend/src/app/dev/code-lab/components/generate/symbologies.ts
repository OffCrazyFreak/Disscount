export interface ISymbology {
  bcid: string;
  label: string;
  sample: string;
  is2d: boolean;
}

export const SYMBOLOGIES: ISymbology[] = [
  { bcid: "qrcode", label: "QR Code", sample: "https://disscount.hr", is2d: true },
  { bcid: "ean13", label: "EAN-13", sample: "4006381333931", is2d: false },
  { bcid: "ean8", label: "EAN-8", sample: "96385074", is2d: false },
  { bcid: "upca", label: "UPC-A", sample: "036000291452", is2d: false },
  { bcid: "code128", label: "Code 128", sample: "CARD-12345", is2d: false },
  { bcid: "code39", label: "Code 39", sample: "CARD12345", is2d: false },
  { bcid: "interleaved2of5", label: "ITF", sample: "0412345678", is2d: false },
  { bcid: "azteccode", label: "Aztec", sample: "DISSCOUNT", is2d: true },
  { bcid: "datamatrix", label: "Data Matrix", sample: "DISSCOUNT", is2d: true },
  { bcid: "pdf417", label: "PDF417", sample: "DISSCOUNT-CARD", is2d: true },
];

export function findSymbology(bcid: string): ISymbology {
  return SYMBOLOGIES.find((s) => s.bcid === bcid) ?? SYMBOLOGIES[0];
}
