interface IFitCodeSizeInput {
  modulesWide: number;
  modulesHigh: number;
  maxWidth: number;
  /** CSS px, or null when only the width constrains the code. */
  maxHeight: number | null;
  dpr: number;
}

export interface ICodeSize {
  width: number;
  height: number;
}

/**
 * Largest size, in CSS px, that gives every module a whole number of device pixels, so
 * each bar edge lands on a pixel boundary. Null when even one device pixel per module
 * does not fit: the caller then scales to the box, which blurs but never overflows.
 */
export function fitCodeSize({
  modulesWide,
  modulesHigh,
  maxWidth,
  maxHeight,
  dpr,
}: IFitCodeSizeInput): ICodeSize | null {
  const byWidth = (maxWidth * dpr) / modulesWide;
  const byHeight =
    maxHeight === null ? Infinity : (maxHeight * dpr) / modulesHigh;
  const perModule = Math.floor(Math.min(byWidth, byHeight));

  if (perModule < 1) return null;

  return {
    width: (modulesWide * perModule) / dpr,
    height: (modulesHigh * perModule) / dpr,
  };
}
