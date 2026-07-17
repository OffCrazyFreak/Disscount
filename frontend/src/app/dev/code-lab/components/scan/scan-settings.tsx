"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IScannerSettings } from "./types";

const DELAYS = [0, 100, 150, 300, 500];

interface IScanSettingsProps {
  settings: IScannerSettings;
  onChange: (settings: IScannerSettings) => void;
}

export default function ScanSettings({
  settings,
  onChange,
}: IScanSettingsProps) {
  function set<K extends keyof IScannerSettings>(
    key: K,
    value: IScannerSettings[K],
  ) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
      <div className="space-y-1.5">
        <Label>Scan delay</Label>
        <Select
          value={String(settings.scanDelay)}
          onValueChange={(v) => set("scanDelay", Number(v))}
        >
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DELAYS.map((d) => (
              <SelectItem key={d} value={String(d)}>
                {d} ms
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="flex items-center gap-2 pb-2 text-sm">
        <Switch
          checked={settings.allowMultiple}
          onCheckedChange={(v) => set("allowMultiple", v)}
        />
        Continuous
      </label>

      <label className="flex items-center gap-2 pb-2 text-sm">
        <Switch
          checked={settings.sound}
          onCheckedChange={(v) => set("sound", v)}
        />
        Sound
      </label>

      <label className="flex items-center gap-2 pb-2 text-sm">
        <Switch
          checked={settings.vibration}
          onCheckedChange={(v) => set("vibration", v)}
        />
        Vibration
      </label>

      <label className="flex items-center gap-2 pb-2 text-sm">
        <Switch
          checked={settings.eanOnly}
          onCheckedChange={(v) => set("eanOnly", v)}
        />
        EAN only
      </label>
    </div>
  );
}
