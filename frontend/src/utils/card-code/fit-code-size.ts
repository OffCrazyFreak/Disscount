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

/** Whole device pixels per module keep bar edges sharp; null when none fit, so the caller scales without overflow. */
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
