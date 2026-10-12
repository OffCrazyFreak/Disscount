"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IScannedCode, ScanPreset } from "@/typings/scanned-code";
import {
  REJECT_HINT_AFTER_MS,
  createConsensusState,
  isRejecting,
  readyCodes,
  recordReads,
} from "@/components/scanner/scan-consensus";

interface IUseScanConsensusOptions {
  preset: ScanPreset;
  onStable: (codes: IScannedCode[]) => void;
}

export default function useScanConsensus({
  preset,
  onStable,
}: IUseScanConsensusOptions) {
  const stateRef = useRef(createConsensusState());
  const doneRef = useRef(false);
  const collectTimerRef = useRef<number | undefined>(undefined);
  const hintTimerRef = useRef<number | undefined>(undefined);
  const onStableRef = useRef(onStable);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    onStableRef.current = onStable;
  }, [onStable]);

  const clearTimers = useCallback(() => {
    window.clearTimeout(collectTimerRef.current);
    window.clearTimeout(hintTimerRef.current);
    collectTimerRef.current = undefined;
    hintTimerRef.current = undefined;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const emitIfReady = useCallback(() => {
    const codes = readyCodes(stateRef.current, Date.now());

    if (!codes || doneRef.current) return;

    doneRef.current = true;
    clearTimers();
    onStableRef.current(codes);
  }, [clearTimers]);

  const handleDetected = useCallback(
    (codes: IScannedCode[]) => {
      if (doneRef.current) return;

      const now = Date.now();
      const state = recordReads(stateRef.current, codes, now, preset);
      stateRef.current = state;

      if (state.collectUntil !== null) {
        if (now >= state.collectUntil) return emitIfReady();

        collectTimerRef.current ??= window.setTimeout(
          emitIfReady,
          state.collectUntil - now,
        );

        return;
      }

      if (state.rejectStart !== null && hintTimerRef.current === undefined) {
        hintTimerRef.current = window.setTimeout(
          () => {
            hintTimerRef.current = undefined;
            if (isRejecting(stateRef.current, Date.now())) setShowHint(true);
          },
          Math.max(0, state.rejectStart + REJECT_HINT_AFTER_MS - now),
        );
      }
    },
    [preset, emitIfReady],
  );

  const reset = useCallback(() => {
    clearTimers();
    stateRef.current = createConsensusState();
    doneRef.current = false;
    setShowHint(false);
  }, [clearTimers]);

  return { handleDetected, showHint, reset };
}
