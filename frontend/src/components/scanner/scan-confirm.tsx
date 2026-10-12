"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import CodeChoiceList, {
  formatLabel,
} from "@/components/scanner/code-choice-list";
import CodePreview from "@/components/scanner/code-preview";
import type { IScannedCode } from "@/typings/scanned-code";

interface IScanConfirmProps {
  candidates: IScannedCode[];
  onConfirm: (code: IScannedCode) => void;
  onRescan: () => void;
  onManual: () => void;
}

export default function ScanConfirm({
  candidates,
  onConfirm,
  onRescan,
  onManual,
}: IScanConfirmProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = candidates[selectedIndex] ?? candidates[0];

  return (
    <div className="space-y-4">
      {candidates.length > 1 && (
        <CodeChoiceList
          codes={candidates}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      )}

      <CodePreview code={selected} />

      <div className="space-y-1 text-center">
        <p className="text-muted-foreground text-sm">{formatLabel(selected)}</p>
        <p className="font-mono text-2xl font-semibold tracking-wide break-all">
          {selected.rawValue}
        </p>
      </div>

      <div className="grid gap-2">
        <Button type="button" onClick={() => onConfirm(selected)}>
          Koristi kod
        </Button>
        <Button type="button" variant="outline" onClick={onRescan}>
          Skeniraj ponovno
        </Button>
        <Button type="button" variant="ghost" onClick={onManual}>
          Upiši ručno
        </Button>
      </div>
    </div>
  );
}
