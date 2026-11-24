import { reloadAfterChunkLoadError } from "@/lib/pwa/chunk-load-recovery";
import { captureBoundaryError } from "@/lib/sentry/capture-boundary-error";

export function handleBoundaryError(error: unknown) {
  if (reloadAfterChunkLoadError(error)) return;

  captureBoundaryError(error);
}
