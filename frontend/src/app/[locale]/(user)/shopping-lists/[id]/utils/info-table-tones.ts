/** Green when the checked items cost less than their average price, red when more. */
export function spentTone(moneySpent: number, potentialCost: number): string {
  if (potentialCost === 0) return "text-gray-700";
  if (moneySpent < potentialCost) return "text-green-700";
  if (moneySpent > potentialCost) return "text-red-700";
  return "text-gray-700";
}

export function savedTone(savedAmount: number): string {
  if (savedAmount > 0) return "text-green-700";
  if (savedAmount < 0) return "text-red-700";
  return "text-gray-700";
}
