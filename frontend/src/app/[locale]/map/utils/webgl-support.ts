/** Chromium refuses a context after repeated GPU crashes, so yesterday's working browser can fail. */
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

export function isGpuError(error: unknown): boolean {
  return error instanceof Error && error.name === "GPUInitializationError";
}
