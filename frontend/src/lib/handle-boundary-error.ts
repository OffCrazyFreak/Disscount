import { reloadAfterChunkLoadError } from "@/lib/pwa/chunk-load-recovery";
import { captureBoundaryError } from "@/lib/sentry/capture-boundary-error";

/** Recovers a chunk left behind by a deploy, and reports anything else. */
export function handleBoundaryError(error: unknown) {
  if (reloadAfterChunkLoadError(error)) return;

  captureBoundaryError(error);
}
