"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ScanBarcode } from "lucide-react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ScanConfirm from "@/components/scanner/scan-confirm";
import ScanManualEntry from "@/components/scanner/scan-manual-entry";
import ScannerCamera from "@/components/scanner/scanner-camera";
import { formatLabel } from "@/components/scanner/code-choice-list";
import type { IScannedCode, ScanPreset } from "@/typings/scanned-code";

type ScannerStep = "camera" | "manual" | "confirm";

const STEP_TITLE_KEYS = {
  camera: "title",
  manual: "manual.title",
  confirm: "confirm.title",
} as const satisfies Record<ScannerStep, string>;

interface IScannerContentProps {
  preset: ScanPreset;
  confirm: boolean;
  onScan: (code: IScannedCode) => void;
}

export default function ScannerContent({
  preset,
  confirm,
  onScan,
}: IScannerContentProps) {
  const t = useTranslations("scanner");
  const [step, setStep] = useState<ScannerStep>("camera");
  const [candidates, setCandidates] = useState<IScannedCode[] | null>(null);
  const [typed, setTyped] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);

  // The previous step's controls unmount and take focus with them; the first mount keeps the dialog's own focus.
  useEffect(() => {
    if (previousStep.current === step) return;

    previousStep.current = step;
    titleRef.current?.focus();
  }, [step]);

  function announcement(): string {
    if (!candidates?.length) return "";

    const label = formatLabel(candidates[0], t);

    if (typed) return t("confirm.announceTyped", { label });

    return candidates.length === 1
      ? t("confirm.announceFound", { label })
      : t("confirm.announceMany", { count: candidates.length });
  }

  function goTo(next: ScannerStep) {
    // A leftover result would be read out again on the next visit to the live region.
    if (next !== "confirm") setCandidates(null);

    setStep(next);
  }

  function handleCodes(codes: IScannedCode[]) {
    navigator.vibrate?.(80);

    if (!confirm) {
      onScan(codes[0]);
      return;
    }

    setTyped(false);
    setCandidates(codes);
    setStep("confirm");
  }

  function handleManual(code: IScannedCode) {
    setTyped(true);
    setCandidates([code]);
    setStep("confirm");
  }

  return (
    <>
      <DialogHeader className="text-left">
        <DialogTitle
          ref={titleRef}
          tabIndex={-1}
          className="flex items-center gap-2 outline-none"
        >
          <ScanBarcode aria-hidden="true" className="size-6" />
          {t(STEP_TITLE_KEYS[step])}
        </DialogTitle>
      </DialogHeader>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement()}
      </p>

      {step === "camera" && (
        <ScannerCamera
          preset={preset}
          canType={confirm}
          onCodes={handleCodes}
          onManual={() => goTo("manual")}
        />
      )}

      {step === "manual" && (
        <ScanManualEntry
          onSubmit={handleManual}
          onBack={() => goTo("camera")}
        />
      )}

      {step === "confirm" && candidates && (
        <ScanConfirm
          candidates={candidates}
          onConfirm={onScan}
          onRescan={() => goTo("camera")}
          onManual={() => goTo("manual")}
        />
      )}
    </>
  );
}
