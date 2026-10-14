"use client";

import { useTranslations } from "next-intl";

import type { CodeType } from "@/constants/card-codes";
import { useDevicePixelWidth } from "@/hooks/use-device-pixel-width";
import { generateCodeSvg } from "@/utils/card-code/generate-code-svg";
import CardCodeFallback from "@/components/custom/card-code/card-code-fallback";
import CardCodeImage from "@/components/custom/card-code/card-code-image";
import {
  codeModules,
  measureCodeSize,
  rotatedCodeStyle,
} from "@/components/custom/card-code/card-code-layout";
import { cn } from "@/lib/utils";

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

function codeKindKey(codeType: CodeType, twoDimensional: boolean) {
  if (codeType === "qr_code") return "view.code.qr";
  return twoDimensional ? "view.code.twoDimensional" : "view.code.linear";
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
  const t = useTranslations("digitalCards");
  const rotated = rotatedLength !== undefined;
  const { ref, measured } = useDevicePixelWidth<HTMLDivElement>(
    rotated ? "self" : fitParentHeight ? "parent" : "none",
  );
  const result = generateCodeSvg(value, codeType);

  if (!result.ok) {
    return (
      <CardCodeFallback
        ref={ref}
        value={value}
        codeType={codeType}
        className={className}
        textFallback={textFallback}
      />
    );
  }

  const [modulesWide, modulesHigh] = codeModules(result.svg);
  const size = measureCodeSize({
    measured,
    rotated,
    twoDimensional: result.twoDimensional,
    modulesWide,
    modulesHigh,
  });

  const kind = t(codeKindKey(codeType, result.twoDimensional));
  const label = labelValue ? t("view.code.withValue", { kind, value }) : kind;

  if (rotated) {
    return (
      <div
        ref={ref}
        className={cn("relative w-full bg-white", className)}
        style={{ height: rotatedLength }}
      >
        {measured && size && (
          <CardCodeImage
            svg={result.svg}
            label={label}
            style={rotatedCodeStyle(measured, size)}
          />
        )}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={cn("flex w-full justify-center bg-white", className)}
    >
      <CardCodeImage
        svg={result.svg}
        label={label}
        style={
          size ?? {
            width: "100%",
            aspectRatio: `${modulesWide} / ${modulesHigh}`,
          }
        }
      />
    </div>
  );
}
