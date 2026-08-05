import "server-only";

import type { ShoppingListDto } from "@/lib/api/types";

const PREVIEW_TIMEOUT_MS = 3000;

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
      {
        cache: "no-store",
        // This route is public and dynamic, so anyone can loop it with arbitrary tokens.
        // Without a deadline a degraded backend pins a Next server request per hit.
        signal: AbortSignal.timeout(PREVIEW_TIMEOUT_MS),
      },
    );

    if (!response.ok) return null;

    return (await response.json()) as ShoppingListDto;
  } catch {
    // A preview is a nicety; a backend blip must not take the page down with it.
    return null;
  }
}
