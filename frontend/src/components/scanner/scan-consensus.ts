import { hasValidCheckDigit } from "@/utils/barcode/check-digits";
import { normalizeScannedCode } from "@/utils/barcode/normalize-code";
import type { IScannedCode, ScanPreset } from "@/typings/scanned-code";

export const CONSENSUS_WINDOW_MS = 1500;
export const COLLECT_WINDOW_MS = 800;
export const REJECT_HINT_AFTER_MS = 5000;
const REJECT_GAP_MS = 2000;

// Formats without a strong check digit misread more often, so they need one more read.
const WEAK_FORMATS = ["code_39", "code_93", "codabar", "itf"];

interface IRead {
  key: string;
  at: number;
}

export interface IConsensusState {
  reads: IRead[];
  stable: IScannedCode[];
  collectUntil: number | null;
  rejectStart: number | null;
  lastReject: number | null;
}

export function createConsensusState(): IConsensusState {
  return {
    reads: [],
    stable: [],
    collectUntil: null,
    rejectStart: null,
    lastReject: null,
  };
}

export function codeKey(code: IScannedCode): string {
  return `${code.format ?? ""}:${code.rawValue}`;
}

export function requiredReads(preset: ScanPreset, format?: string): number {
  if (preset === "product") return 2;

  return format && WEAK_FORMATS.includes(format) ? 4 : 3;
}

function recordReject(state: IConsensusState, now: number): IConsensusState {
  const continuing =
    state.lastReject !== null && now - state.lastReject <= REJECT_GAP_MS;

  return {
    ...state,
    lastReject: now,
    rejectStart: continuing ? state.rejectStart : now,
  };
}

function recordRead(
  state: IConsensusState,
  raw: IScannedCode,
  now: number,
  preset: ScanPreset,
): IConsensusState {
  // Products keep the scanner's own value: price data may list a UPC-A item under its
  // 12 digits, and a leading 0 would miss it. Cards store one canonical form instead.
  const code =
    preset === "all"
      ? normalizeScannedCode(raw)
      : { ...raw, rawValue: raw.rawValue.trim() };

  if (!code.rawValue) return state;

  if (!hasValidCheckDigit(code.rawValue, code.format ?? "")) {
    return recordReject(state, now);
  }

  const key = codeKey(code);
  const reads = [
    ...state.reads.filter((read) => now - read.at <= CONSENSUS_WINDOW_MS),
    { key, at: now },
  ];
  const count = reads.filter((read) => read.key === key).length;
  const alreadyStable = state.stable.some((s) => codeKey(s) === key);

  if (count < requiredReads(preset, code.format) || alreadyStable) {
    return { ...state, reads };
  }

  return {
    ...state,
    reads,
    stable: [...state.stable, code],
    // Only "all" waits for a second code; products emit on the first stable one.
    collectUntil:
      state.collectUntil ?? now + (preset === "all" ? COLLECT_WINDOW_MS : 0),
    rejectStart: null,
    lastReject: null,
  };
}

export function recordReads(
  state: IConsensusState,
  codes: IScannedCode[],
  now: number,
  preset: ScanPreset,
): IConsensusState {
  return codes.reduce(
    (next, code) => recordRead(next, code, now, preset),
    state,
  );
}

export function readyCodes(
  state: IConsensusState,
  now: number,
): IScannedCode[] | null {
  if (state.collectUntil === null || now < state.collectUntil) return null;

  return state.stable;
}

export function isRejecting(state: IConsensusState, now: number): boolean {
  if (state.rejectStart === null || state.lastReject === null) return false;

  return (
    now - state.lastReject <= REJECT_GAP_MS &&
    now - state.rejectStart >= REJECT_HINT_AFTER_MS
  );
}
