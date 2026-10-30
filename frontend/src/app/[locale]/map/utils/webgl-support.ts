/**
 * Whether the browser hands out a WebGL2 context right now. Chromium refuses
 * one for the rest of the session after its GPU process crashes a few times,
 * so a browser that showed the map yesterday can fail today.
 */
export function canUseWebGL2(): boolean {
  try {
    const context = document.createElement("canvas").getContext("webgl2");
    // Probe contexts count towards the browser's per-page limit, so free it.
    context?.getExtension("WEBGL_lose_context")?.loseContext();

    return context != null;
  } catch {
    return false;
  }
}

/** MapLibre's error for a missing or refused WebGL2 context. */
export function isGpuError(error: unknown): boolean {
  return error instanceof Error && error.name === "GPUInitializationError";
}
