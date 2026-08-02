"use client";

import { useId, useMemo } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCameraLabels } from "@/utils/browser/camera";

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
  const namedCameras = useMemo(() => formatCameraLabels(devices), [devices]);
  const selectId = useId();

  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1 space-y-1.5">
        <Label htmlFor={selectId}>Kamera</Label>
        <Select
          value={value ?? ""}
          onValueChange={onSelect}
          disabled={devices.length === 0}
        >
          <SelectTrigger id={selectId} className="w-full">
            <SelectValue placeholder="Automatski (stražnja kamera)" />
          </SelectTrigger>
          <SelectContent>
            {namedCameras.map((camera) => (
              <SelectItem
                key={camera.deviceId}
                value={camera.deviceId}
                title={camera.rawLabel}
              >
                {camera.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          {/* aria-disabled rather than the native attribute, matching
              SearchNavButton: disabled drops the control out of the tab order and
              kills the pointer events the tooltip needs, so the only explanation
              of this icon vanished exactly when it was least obvious. */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            icon={RotateCcw}
            iconPlacement="left"
            aria-disabled={!hasManualChoice}
            onClick={() => {
              if (!hasManualChoice) return;

              onReset();
            }}
            className="aria-disabled:pointer-events-auto aria-disabled:opacity-50"
            aria-label="Resetiraj kameru na automatski odabir"
          />
        </TooltipTrigger>

        <TooltipContent className="px-2 py-1 text-xs">
          Resetiraj kameru na automatski odabir
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
