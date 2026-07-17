"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScanLog from "./scan-log";
import ScanSettings from "./scan-settings";
import PermissionHelp from "./permission-help";
import YudielScanner from "./scanners/yudiel-scanner";
import {
  IScanEntry,
  IScannerSettings,
  SCAN_ENGINES,
  ScanEngine,
} from "./types";

const ModernScanner = dynamic(() => import("./scanners/modern-scanner"), {
  ssr: false,
});
const Html5Scanner = dynamic(() => import("./scanners/html5-scanner"), {
  ssr: false,
});

export default function ScannerPanel() {
  const [engine, setEngine] = useState<ScanEngine | null>(null);
  const [entries, setEntries] = useState<IScanEntry[]>([]);
  const [settings, setSettings] = useState<IScannerSettings>({
    scanDelay: 150,
    allowMultiple: true,
    sound: false,
    vibration: true,
  });

  const mountedAtRef = useRef(0);
  const firstDecodeDoneRef = useRef(false);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);

  useEffect(() => {
    mountedAtRef.current = Date.now();
    firstDecodeDoneRef.current = false;
  }, [engine]);

  function switchEngine(next: ScanEngine) {
    setEngine((current) => (current === next ? null : next));
  }

  function handleDetect(value: string, format: string) {
    const now = Date.now();
    const last = lastScanRef.current;
    if (last && last.value === value && now - last.at < 2000) return;

    lastScanRef.current = { value, at: now };

    if (settings.vibration) navigator.vibrate?.(80);

    const msToFirstDecode = firstDecodeDoneRef.current
      ? undefined
      : now - mountedAtRef.current;
    firstDecodeDoneRef.current = true;

    setEntries((prev) =>
      [
        {
          id: crypto.randomUUID(),
          engine: engine ?? "yudiel",
          value,
          format,
          at: now,
          msToFirstDecode,
        },
        ...prev,
      ].slice(0, 50),
    );
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        {SCAN_ENGINES.map((e) => (
          <Button
            key={e.id}
            type="button"
            variant={engine === e.id ? "default" : "outline"}
            onClick={() => switchEngine(e.id)}
            className="h-auto flex-col items-start gap-0.5 py-2"
          >
            <span className="flex items-center gap-1.5 font-mono text-xs">
              {engine === e.id ? (
                <Camera className="size-3.5" />
              ) : (
                <CameraOff className="size-3.5" />
              )}
              {e.label}
            </span>
            <span className="text-[10px] font-normal opacity-70">{e.note}</span>
          </Button>
        ))}
      </div>

      <ScanSettings settings={settings} onChange={setSettings} />

      <PermissionHelp />

      {engine === null && (
        <p className="rounded-xl border border-dashed p-8 text-center font-mono text-xs text-muted-foreground">
          Pick an engine to start the camera. Tap it again to stop.
        </p>
      )}

      {engine === "yudiel" && (
        <YudielScanner settings={settings} onDetect={handleDetect} />
      )}
      {engine === "modern" && (
        <ModernScanner settings={settings} onDetect={handleDetect} />
      )}
      {engine === "html5" && (
        <Html5Scanner settings={settings} onDetect={handleDetect} />
      )}

      <ScanLog entries={entries} onClear={() => setEntries([])} />
    </section>
  );
}
