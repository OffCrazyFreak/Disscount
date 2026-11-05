"use client";

import type { Ref } from "react";
import { useTranslations } from "next-intl";

import type { CodeType } from "@/constants/card-codes";
import { groupCodeValue } from "@/utils/card-code/group-code-value";
import { cn } from "@/lib/utils";

interface ICardCodeFallbackProps {
  ref: Ref<HTMLDivElement>;
  value: string;
  codeType: CodeType;
  className?: string;
  textFallback: boolean;
}

export default function CardCodeFallback({
  ref,
  value,
  codeType,
  className,
  textFallback,
}: ICardCodeFallbackProps) {
  const t = useTranslations("digitalCards");

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
          {t("view.code.cannotDraw")}
        </p>
      )}
    </div>
  );
}
