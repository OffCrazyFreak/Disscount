import { pluralizeCroatian } from "@/utils/strings";

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
    // A fraction takes the genitive singular (1,5 boda), which is the "few" form.
    const noun = Number.isInteger(balance)
      ? pluralizeCroatian(Math.abs(balance), "bod", "boda", "bodova")
      : "boda";

    return `${new Intl.NumberFormat("hr-HR").format(balance)} ${noun}`;
  }

  return new Intl.NumberFormat("hr-HR", {
    style: "currency",
    currency: unit,
  }).format(balance);
}
