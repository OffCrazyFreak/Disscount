"use client";

import { useMemo, useState } from "react";
import {
  Scanner,
  useDevices,
  outline,
  boundingBox,
  centerText,
} from "@yudiel/react-qr-scanner";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clearPreferredCamera,
  getPreferredCamera,
  setPreferredCamera,
} from "../camera-prefs";
import ScanOverlay from "../scan-overlay";
import { IScannerProps } from "../types";

const TRACKERS = { outline, boundingBox, centerText };

type TrackerKey = keyof typeof TRACKERS;

function describeError(err: unknown): string {
  if (err && typeof err === "object" && "kind" in err) {
    return `${String((err as { kind: unknown }).kind)} - try another camera or reset the choice`;
  }

  return err instanceof Error ? err.message : String(err);
}

export default function YudielScanner({ settings, onDetect }: IScannerProps) {
  const devices = useDevices();
  const [deviceId, setDeviceId] = useState<string | undefined>(
    () => getPreferredCamera() ?? undefined,
  );
  const [tracker, setTracker] = useState<TrackerKey>("outline");
  const [error, setError] = useState<string | null>(null);

  const constraints = useMemo(
    () => (deviceId ? { deviceId } : { facingMode: "environment" as const }),
    [deviceId],
  );

  function handleDeviceChange(id: string) {
    setDeviceId(id);
    setPreferredCamera(id);
    setError(null);
  }

  function handleReset() {
    clearPreferredCamera();
    setDeviceId(undefined);
    setError(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label>Camera</Label>
          <Select value={deviceId ?? ""} onValueChange={handleDeviceChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Auto (rear camera)" />
            </SelectTrigger>
            <SelectContent>
              {devices.map((d, i) => (
                <SelectItem key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${i + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Tracker</Label>
          <Select
            value={tracker}
            onValueChange={(v) => setTracker(v as TrackerKey)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(TRACKERS).map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleReset}
          title="Forget remembered camera"
        >
          <RotateCcw />
        </Button>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 font-mono text-xs text-destructive">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="relative overflow-hidden rounded-xl bg-black">
        <ScanOverlay showScanLine />
        <Scanner
          onScan={(codes) => {
            if (codes[0]) onDetect(codes[0].rawValue, codes[0].format);
          }}
          onError={(err) => setError(describeError(err))}
          formats={[
            "qr_code",
            "aztec",
            "codabar",
            "code_39",
            "code_93",
            "code_128",
            "data_matrix",
            "ean_8",
            "ean_13",
            "itf",
            "pdf417",
            "upc_a",
            "upc_e",
          ]}
          constraints={constraints}
          scanDelay={settings.scanDelay}
          allowMultiple={settings.allowMultiple}
          sound={settings.sound}
          components={{
            torch: true,
            zoom: true,
            finder: false,
            onOff: true,
            tracker: TRACKERS[tracker],
          }}
        />
      </div>
    </div>
  );
}
