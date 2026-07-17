export function ean13CheckDigit(digits12: string): number | null {
  if (!/^\d{12}$/.test(digits12)) return null;

  const sum = digits12
    .split("")
    .reduce((acc, d, i) => acc + Number(d) * (i % 2 === 0 ? 1 : 3), 0);

  return (10 - (sum % 10)) % 10;
}

export function isValidEan13(value: string): boolean {
  return (
    /^\d{13}$/.test(value) &&
    ean13CheckDigit(value.slice(0, 12)) === Number(value[12])
  );
}

export function isValidUpcA(value: string): boolean {
  return /^\d{12}$/.test(value) && isValidEan13("0" + value);
}

export function detectSymbology(value: string): string {
  if (isValidEan13(value)) return "ean13";
  if (isValidUpcA(value)) return "upca";
  if (/^[\x20-\x7e]+$/.test(value)) return "code128";

  return "qrcode";
}
