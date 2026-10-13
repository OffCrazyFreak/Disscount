// Groups of four read faster than one long digit run when a cashier types it in.
export function groupCodeValue(value: string): string {
  return /^\d+$/.test(value) ? (value.match(/.{1,4}/g) ?? []).join(" ") : value;
}
