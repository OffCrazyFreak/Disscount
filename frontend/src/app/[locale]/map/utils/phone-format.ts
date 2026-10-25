/**
 * Groups a Croatian number the way Croatians write it nationally: 091 234 5678,
 * 01 2345 678, 021 123 456, 0800 400 000. Groupings follow libphonenumber's
 * Croatian metadata, which the numbering plan leaves open. Anything that is
 * not a +385 number comes back unchanged.
 */
export function formatCroatianPhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  const match = /^(?:\+385|00385|0)(\d{7,9})$/.exec(digits);
  if (!match) return phone;

  const significant = match[1];
  const groups = groupSignificant(significant);

  return `0${groups.join(" ")}`;
}

function groupSignificant(n: string): string[] {
  // Zagreb is the only one-digit area code.
  if (n.startsWith("1")) return [n.slice(0, 1), n.slice(1, 5), n.slice(5)];

  // Toll-free and shared-cost numbers: 0800 400 000, or 0800 12 345 when short.
  if (/^8[01]/.test(n)) {
    return n.length === 8
      ? [n.slice(0, 3), n.slice(3, 5), n.slice(5)]
      : [n.slice(0, 3), n.slice(3, 6), n.slice(6)];
  }

  // Mobile, other area codes and value-added numbers: two-digit prefix.
  return [n.slice(0, 2), n.slice(2, 5), n.slice(5)];
}
