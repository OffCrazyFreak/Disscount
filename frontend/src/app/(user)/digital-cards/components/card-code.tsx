"use client";

import type { CodeType } from "@/constants/card-codes";
import { useDevicePixelWidth } from "@/app/(user)/digital-cards/hooks/use-device-pixel-width";
import { generateCodeSvg } from "@/app/(user)/digital-cards/utils/generate-code-svg";
import { groupCodeValue } from "@/app/(user)/digital-cards/utils/group-code-value";
import { cn } from "@/lib/utils";

// A matrix code at full panel width is taller than the screen on a phone in landscape.
const MAX_MATRIX_WIDTH_PX = 360;

interface ICardCodeProps {
  value: string;
  codeType: CodeType;
  className?: string;
  /** Off, a code that cannot be drawn leaves a short note instead of repeating the number the caller already shows. */
  textFallback?: boolean;
}

function codeKindLabel(codeType: CodeType, twoDimensional: boolean): string {
  if (codeType === "qr_code") return "QR kod";
  return twoDimensional ? "2D kod" : "Crtični kod";
}

export default function CardCode({
  value,
  codeType,
  className,
  textFallback = true,
}: ICardCodeProps) {
  const { ref, measured } = useDevicePixelWidth<HTMLDivElement>();
  const result = generateCodeSvg(value, codeType);

  let content;

  if (!result.ok) {
    content = textFallback ? (
      <p className="break-all p-3 text-center font-mono text-2xl font-semibold tracking-wider text-black">
        {groupCodeValue(value)}
      </p>
    ) : codeType === "unknown" ? null : (
      <p className="p-3 text-sm text-neutral-700">
        Ovaj kod se ne može nacrtati. Pročitaj broj ispod ili probaj drugi tip.
      </p>
    );
  } else {
    const [, modulesWide, modulesHigh] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/
      .exec(result.svg)!
      .map(Number);

    // Whole device pixels per module keep every bar edge on a pixel boundary.
    let size: { width: number; height: number } | undefined;
    if (measured && measured.width > 0) {
      const usable = result.twoDimensional
        ? Math.min(measured.width, MAX_MATRIX_WIDTH_PX)
        : measured.width;
      const perModule = Math.max(
        1,
        Math.floor((usable * measured.dpr) / modulesWide),
      );

      size = {
        width: (modulesWide * perModule) / measured.dpr,
        height: (modulesHigh * perModule) / measured.dpr,
      };
    }

    content = (
      <div
        role="img"
        aria-label={`${codeKindLabel(codeType, result.twoDimensional)}: ${value}`}
        className="[&>svg]:size-full"
        style={
          size ?? {
            width: "100%",
            aspectRatio: `${modulesWide} / ${modulesHigh}`,
          }
        }
        dangerouslySetInnerHTML={{ __html: result.svg }}
      />
    );
  }

  return (
    <div
      ref={ref}
      className={cn("flex w-full justify-center bg-white", className)}
    >
      {content}
    </div>
  );
}
