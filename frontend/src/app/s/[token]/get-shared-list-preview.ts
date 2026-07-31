import "server-only";

import type { ShoppingListDto } from "@/lib/api/types";

/**
 * Server-side read used only for the link preview. It goes straight to the backend origin
 * rather than through the Next rewrite, which only rewrites browser requests.
 *
 * Never cached: a revoked link has to stop previewing immediately, and the rendered HTML
 * is also excluded from the service worker's page cache in sw.ts for the same reason.
 */
export async function getSharedListPreview(
  token: string,
): Promise<ShoppingListDto | null> {
  const origin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

  try {
    const response = await fetch(
      `${origin}/api/shared/${encodeURIComponent(token)}`,
      { cache: "no-store" },
    );

    if (!response.ok) return null;

    return (await response.json()) as ShoppingListDto;
  } catch {
    // A preview is a nicety; a backend blip must not take the page down with it.
    return null;
  }
}

/** Croatian counts: 1 stavka, 2 to 4 stavke, 5 or more stavki, ignoring the teens. */
export function formatItemCount(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo < 11 || lastTwo > 14) {
    if (last === 1) return `${count} stavka`;
    if (last >= 2 && last <= 4) return `${count} stavke`;
  }

  return `${count} stavki`;
}
