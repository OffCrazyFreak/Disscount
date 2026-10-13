"use client";

import type { CSSProperties } from "react";

import type { CodeType } from "@/constants/card-codes";
import { useDevicePixelWidth } from "@/app/[locale]/(user)/digital-cards/hooks/use-device-pixel-width";
import {
  fitCodeSize,
  type ICodeSize,
} from "@/app/[locale]/(user)/digital-cards/utils/fit-code-size";
import { generateCodeSvg } from "@/app/[locale]/(user)/digital-cards/utils/generate-code-svg";
import { groupCodeValue } from "@/app/[locale]/(user)/digital-cards/utils/group-code-value";
import { cn } from "@/lib/utils";

// A matrix code at full panel width is taller than the screen on a phone in landscape.
const MAX_MATRIX_WIDTH_PX = 360;

interface ICardCodeProps {
  value: string;
  codeType: CodeType;
  className?: string;
  /** Off, a code that cannot be drawn leaves a short note instead of repeating the number the caller already shows. */
  textFallback?: boolean;
  /** On, the accessible name carries the number; leave off when the caller prints it next to the code. */
  labelValue?: boolean;
  /** Keeps the code inside a parent of fixed height, such as the 3:2 tile back. */
  fitParentHeight?: boolean;
  /** CSS length. Draws a linear code turned a quarter, with this as its length on screen. */
  rotatedLength?: string;
}

function codeKindLabel(codeType: CodeType, twoDimensional: boolean): string {
  if (codeType === "qr_code") return "QR kod";
  return twoDimensional ? "2D kod" : "Crtični kod";
}

// Snaps a CSS offset to a device pixel so the rotated bars are not smeared by a half pixel.
function snap(offset: number, dpr: number): number {
  return Math.round(offset * dpr) / dpr;
}

export default function CardCode({
  value,
  codeType,
  className,
  textFallback = true,
  labelValue = false,
  fitParentHeight = false,
  rotatedLength,
}: ICardCodeProps) {
  const rotated = rotatedLength !== undefined;
  const { ref, measured } = useDevicePixelWidth<HTMLDivElement>(
    rotated ? "self" : fitParentHeight ? "parent" : "none",
  );
  const result = generateCodeSvg(value, codeType);

  if (!result.ok) {
    return (
      <div
        ref={ref}
        className={cn("flex w-full justify-center bg-white", className)}
      >
        {textFallback ? (
          <p className="break-all p-3 text-center font-mono text-2xl font-semibold tracking-wider text-black">
            {groupCodeValue(value)}
          </p>
        ) : codeType === "unknown" ? null : (
          <p className="p-3 text-sm text-neutral-700">
            Ovaj kod se ne može nacrtati. Pročitaj broj ispod ili probaj drugi
            tip.
          </p>
        )}
      </div>
    );
  }

  const [, modulesWide, modulesHigh] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/
    .exec(result.svg)!
    .map(Number);

  let size: ICodeSize | undefined;
  if (measured && measured.width > 0) {
    // A rotated code runs along the box height and has the box width to spare across.
    const along = rotated ? (measured.height ?? 0) : measured.width;
    const across = rotated ? measured.width : measured.height;
    const maxWidth = result.twoDimensional
      ? Math.min(along, MAX_MATRIX_WIDTH_PX)
      : along;

    size =
      fitCodeSize({
        modulesWide,
        modulesHigh,
        maxWidth,
        maxHeight: across,
        dpr: measured.dpr,
      }) ??
      // Under one device pixel per module nothing stays crisp; shrink to fit, never overflow.
      scaleToFit(modulesWide, modulesHigh, maxWidth, across);
  }

  const kind = codeKindLabel(codeType, result.twoDimensional);
  const image = (style: CSSProperties) => (
    <div
      role="img"
      aria-label={labelValue ? `${kind}: ${value}` : kind}
      className="[&>svg]:size-full"
      style={style}
      dangerouslySetInnerHTML={{ __html: result.svg }}
    />
  );

  if (rotated) {
    const box = measured && size ? { measured, size } : null;

    return (
      <div
        ref={ref}
        className={cn("relative w-full bg-white", className)}
        style={{ height: rotatedLength }}
      >
        {box &&
          image({
            position: "absolute",
            left: 0,
            top: 0,
            width: box.size.width,
            height: box.size.height,
            transformOrigin: "0 0",
            // Turns about the top-left corner, then lands the turned box centred on whole device pixels.
            transform: `translate(${snap((box.measured.width - box.size.height) / 2, box.measured.dpr)}px, ${snap(((box.measured.height ?? 0) - box.size.width) / 2, box.measured.dpr)}px) rotate(90deg) translateY(-100%)`,
          })}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn("flex w-full justify-center bg-white", className)}
    >
      {image(
        size ?? {
          width: "100%",
          aspectRatio: `${modulesWide} / ${modulesHigh}`,
        },
      )}
    </div>
  );
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
