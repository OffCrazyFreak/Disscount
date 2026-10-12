"use client";

import { useEffect, useRef, useState } from "react";
import { ScanBarcode } from "lucide-react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ScanConfirm from "@/components/scanner/scan-confirm";
import ScanManualEntry from "@/components/scanner/scan-manual-entry";
import ScannerCamera from "@/components/scanner/scanner-camera";
import { formatLabel } from "@/components/scanner/code-choice-list";
import type { IScannedCode, ScanPreset } from "@/typings/scanned-code";

type ScannerStep = "camera" | "manual" | "confirm";

const STEP_TITLES: Record<ScannerStep, string> = {
  camera: "Skeniraj kod",
  manual: "Upiši kod ručno",
  confirm: "Provjeri kod",
};

interface IScannerContentProps {
  preset: ScanPreset;
  confirm: boolean;
  onScan: (code: IScannedCode) => void;
}

function announcement(candidates: IScannedCode[] | null): string {
  if (!candidates?.length) return "";

  return candidates.length === 1
    ? `Pronađen kod: ${formatLabel(candidates[0])}`
    : `Pronađeno kodova: ${candidates.length}`;
}

export default function ScannerContent({
  preset,
  confirm,
  onScan,
}: IScannerContentProps) {
  const [step, setStep] = useState<ScannerStep>("camera");
  const [candidates, setCandidates] = useState<IScannedCode[] | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // The camera view unmounts on a step change and takes focus with it.
  useEffect(() => {
    if (step !== "camera") titleRef.current?.focus();
  }, [step]);

  function handleCodes(codes: IScannedCode[]) {
    navigator.vibrate?.(80);

    if (!confirm) {
      onScan(codes[0]);
      return;
    }

    setCandidates(codes);
    setStep("confirm");
  }

  function handleManual(code: IScannedCode) {
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
          {STEP_TITLES[step]}
        </DialogTitle>
      </DialogHeader>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement(candidates)}
      </p>

      {step === "camera" && (
        <ScannerCamera
          preset={preset}
          canType={confirm}
          onCodes={handleCodes}
          onManual={() => setStep("manual")}
        />
      )}

      {step === "manual" && (
        <ScanManualEntry
          onSubmit={handleManual}
          onBack={() => setStep("camera")}
        />
      )}

      {step === "confirm" && candidates && (
        <ScanConfirm
          candidates={candidates}
          onConfirm={onScan}
          onRescan={() => setStep("camera")}
          onManual={() => setStep("manual")}
        />
      )}
    </>
  );
}
