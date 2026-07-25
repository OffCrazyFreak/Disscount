"use client";

import { useGetShoppingListById } from "@/lib/api/shopping-lists/hooks";

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface IBottomNavCompletionRingProps {
  listId: string;
}

/**
 * Scoped to a single list's page, so a glance at the bar in a store shows how far
 * through you are. The caller guards on the route, so this query is never even
 * created elsewhere.
 */
export default function BottomNavCompletionRing({
  listId,
}: IBottomNavCompletionRingProps) {
  const { data: shoppingList } = useGetShoppingListById(listId);

  const items = shoppingList?.items ?? [];
  const checked = items.filter((item) => item.isChecked).length;

  if (items.length === 0) return null;

  const progress = checked / items.length;

  return (
    <svg
      aria-hidden
      viewBox="0 0 60 60"
      className="pointer-events-none absolute size-[var(--bottom-nav-disc-size)] -rotate-90"
    >
      <circle
        cx="30"
        cy="30"
        r={RADIUS}
        fill="none"
        strokeWidth="3"
        className="stroke-primary/20"
      />
      <circle
        cx="30"
        cy="30"
        r={RADIUS}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        className="stroke-primary transition-[stroke-dashoffset] duration-300 motion-reduce:transition-none"
      />
    </svg>
  );
}
