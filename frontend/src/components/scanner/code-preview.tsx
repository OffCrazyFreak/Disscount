"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { isCodeType } from "@/constants/card-codes";
import type { IScannedCode } from "@/typings/scanned-code";

// Lazy so product scans never download the barcode encoder.
const CardCode = dynamic(
  () => import("@/app/(user)/digital-cards/components/card-code"),
  { ssr: false, loading: () => <Skeleton className="h-24 w-full" /> },
);

interface ICodePreviewProps {
  code: IScannedCode;
}

export default function CodePreview({ code }: ICodePreviewProps) {
  const codeType =
    code.format && isCodeType(code.format) ? code.format : "unknown";

  return (
    <div className="rounded-lg bg-white p-3">
      <CardCode value={code.rawValue} codeType={codeType} />
    </div>
  );
}
