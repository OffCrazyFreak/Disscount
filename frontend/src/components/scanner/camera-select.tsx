"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ICameraSelectProps {
  devices: MediaDeviceInfo[];
  value?: string;
  hasManualChoice: boolean;
  onSelect: (deviceId: string) => void;
  onReset: () => void;
}

export default function CameraSelect({
  devices,
  value,
  hasManualChoice,
  onSelect,
  onReset,
}: ICameraSelectProps) {
  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1 space-y-1.5">
        <Label>Kamera</Label>
        <Select value={value ?? ""} onValueChange={onSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Automatski (stražnja kamera)" />
          </SelectTrigger>
          <SelectContent>
            {devices.map((device, index) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Kamera ${index + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasManualChoice && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onReset}
          title="Vrati na automatski odabir kamere"
        >
          <RotateCcw />
        </Button>
      )}
    </div>
  );
}
