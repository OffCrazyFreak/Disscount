// API dates arrive as YYYY-MM-DD; split instead of parsing so no timezone shifts the day.
export function formatCardDate(value: string): string {
  const [year, month, day] = value.split("-");

  return `${day}.${month}.${year}.`;
}

export function formatCardBalance(
  balance: number,
  unit: string | null,
): string {
  if (!unit) {
    return `${new Intl.NumberFormat("hr-HR").format(balance)} bodova`;
  }

  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: unit,
  }).format(balance);
}
