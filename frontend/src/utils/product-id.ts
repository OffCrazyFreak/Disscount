// cijene keeps any barcode of 8 or more digits and gives products without one a "<chain>:<code>" id.
const PRODUCT_ID = /^(?:\d{8,64}|[a-z0-9_-]+:[^\s/]{1,64})$/;

/** Shape check only: in-store codes fail the GS1 check digit yet are real products */
export function isWellFormedProductId(id: string): boolean {
  return PRODUCT_ID.test(id);
}

/** Next hands the page [id] encoded but generateMetadata decoded, so both decode here to share one lookup; a bare "%" stays. */
export function decodeProductId(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}
