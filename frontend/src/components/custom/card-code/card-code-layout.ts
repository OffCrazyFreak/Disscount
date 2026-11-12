import type { CSSProperties } from "react";

import type { IDevicePixelBox } from "@/hooks/use-device-pixel-width";
import { fitCodeSize, type ICodeSize } from "@/utils/card-code/fit-code-size";

// A matrix code at full panel width is taller than the screen on a phone in landscape.
const MAX_MATRIX_WIDTH_PX = 360;

interface ICodeSizeInput {
  measured: IDevicePixelBox | null;
  rotated: boolean;
  twoDimensional: boolean;
  modulesWide: number;
  modulesHigh: number;
}

export function codeModules(svg: string): [number, number] {
  const [, modulesWide, modulesHigh] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/
    .exec(svg)!
    .map(Number);

  return [modulesWide, modulesHigh];
}

export function measureCodeSize({
  measured,
  rotated,
  twoDimensional,
  modulesWide,
  modulesHigh,
}: ICodeSizeInput): ICodeSize | undefined {
  if (!measured || measured.width <= 0) return undefined;

  // A rotated code runs along the box height and has the box width to spare across.
  const along = rotated ? (measured.height ?? 0) : measured.width;
  const across = rotated ? measured.width : measured.height;
  const maxWidth = twoDimensional
    ? Math.min(along, MAX_MATRIX_WIDTH_PX)
    : along;

  return (
    fitCodeSize({
      modulesWide,
      modulesHigh,
      maxWidth,
      maxHeight: across,
      dpr: measured.dpr,
    }) ??
    // Under one device pixel per module nothing stays crisp; shrink to fit, never overflow.
    scaleToFit(modulesWide, modulesHigh, maxWidth, across)
  );
}

export function rotatedCodeStyle(
  measured: IDevicePixelBox,
  size: ICodeSize,
): CSSProperties {
  const x = snap((measured.width - size.height) / 2, measured.dpr);
  const y = snap(((measured.height ?? 0) - size.width) / 2, measured.dpr);

  return {
    position: "absolute",
    left: 0,
    top: 0,
    width: size.width,
    height: size.height,
    transformOrigin: "0 0",
    // Turns about the top-left corner, then lands the turned box centred on whole device pixels.
    transform: `translate(${x}px, ${y}px) rotate(90deg) translateY(-100%)`,
  };
}

// Snaps a CSS offset to a device pixel so the rotated bars are not smeared by a half pixel.
function snap(offset: number, dpr: number): number {
  return Math.round(offset * dpr) / dpr;
}

function scaleToFit(
  modulesWide: number,
  modulesHigh: number,
  maxWidth: number,
  maxHeight: number | null,
): ICodeSize {
  const scale = Math.min(
    maxWidth / modulesWide,
    maxHeight === null ? Infinity : maxHeight / modulesHigh,
  );

  return { width: modulesWide * scale, height: modulesHigh * scale };
}
