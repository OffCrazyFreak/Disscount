// cijene keeps any barcode of 8 or more digits and gives products without one a "<chain>:<code>" id.
const PRODUCT_ID = /^(?:\d{8,64}|[a-z0-9_-]+:[^\s/]{1,64})$/;

/** Shape check only: in-store codes fail the GS1 check digit yet are real products */
export function isWellFormedProductId(id: string): boolean {
  return PRODUCT_ID.test(id);
}

/** Next hands the page [id] encoded but generateMetadata decoded, so both decode here; a bare "%" stays. */
export function decodeProductId(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

const GTIN_8 = 8;
const GTIN_13 = 13;
const GTIN_14 = 14;

/** GS1 in-store prefixes, judged on the padded form; the backend's CanonicalBarcode.isRestrictedCirculation. */
function isRestrictedCirculation(digits: string): boolean {
  const code = digits.replace(/^0+/, "");

  if (code.length <= GTIN_8) {
    const first = code.padStart(GTIN_8, "0")[0];
    return first === "0" || first === "2";
  }

  // A GTIN-14 is judged by the GTIN-13 behind its indicator digit.
  const prefix =
    code.length <= GTIN_13
      ? code.padStart(GTIN_13, "0").slice(0, 2)
      : code.padStart(GTIN_14, "0").slice(1, 3);

  return prefix === "02" || prefix === "04" || prefix[0] === "2";
}

// Ported from cijene-api normalize_barcode like CanonicalBarcode.of, so stored rows and product ids compare alike.
export function canonicalProductId(id: string): string {
  const code = id.trim();
  if (!/^[0-9]{8,}$/.test(code)) return code;

  const stripped = code.replace(/^0+/, "");
  if (stripped === "" || isRestrictedCirculation(stripped)) return code;

  return stripped;
}

/** Stored rows hold the canonical code, so a padded product id still finds its watch or list item. */
export function isSameProduct(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  return canonicalProductId(a) === canonicalProductId(b);
}
