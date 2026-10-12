const DIGITS_ONLY = /^\d+$/;

// GS1 mod-10: weights 3,1,3,1... from the digit next to the check digit, leftwards.
function hasValidGs1CheckDigit(value: string): boolean {
  const body = value.slice(0, -1);
  const check = Number(value.slice(-1));
  let sum = 0;

  for (let i = 0; i < body.length; i += 1) {
    const digit = Number(body[body.length - 1 - i]);
    sum += digit * (i % 2 === 0 ? 3 : 1);
  }

  return (10 - (sum % 10)) % 10 === check;
}

// Eight digit input is number system + six digits + check; the six digit body is
// zero-suppressed according to its last digit.
function expandUpcE(value: string): string {
  const numberSystem = value[0];
  const [d1, d2, d3, d4, d5, d6] = value.slice(1, 7);
  const last = Number(d6);
  let body: string;

  if (last <= 2) body = `${d1}${d2}${d6}0000${d3}${d4}${d5}`;
  else if (last === 3) body = `${d1}${d2}${d3}00000${d4}${d5}`;
  else if (last === 4) body = `${d1}${d2}${d3}${d4}00000${d5}`;
  else body = `${d1}${d2}${d3}${d4}${d5}0000${d6}`;

  return `${numberSystem}${body}${value[7]}`;
}

function hasValidUpcECheckDigit(value: string): boolean {
  if (![6, 7, 8].includes(value.length)) return false;

  // Six and seven digit forms carry no check digit, so there is nothing to verify.
  if (value.length < 8) return true;

  if (value[0] !== "0" && value[0] !== "1") return false;

  return hasValidGs1CheckDigit(expandUpcE(value));
}

const FIXED_LENGTHS: Record<string, number> = {
  ean_13: 13,
  ean_8: 8,
  upc_a: 12,
};

// True for formats without a mandatory check digit, so callers can pass any scan through.
export function hasValidCheckDigit(value: string, format: string): boolean {
  const length = FIXED_LENGTHS[format];

  if (length !== undefined) {
    return (
      value.length === length &&
      DIGITS_ONLY.test(value) &&
      hasValidGs1CheckDigit(value)
    );
  }

  if (format === "upc_e") {
    return DIGITS_ONLY.test(value) && hasValidUpcECheckDigit(value);
  }

  // Only the 14 digit form is an ITF-14 (GTIN); shorter ITF is free-form.
  if (format === "itf" && value.length === 14) {
    return DIGITS_ONLY.test(value) && hasValidGs1CheckDigit(value);
  }

  return true;
}
