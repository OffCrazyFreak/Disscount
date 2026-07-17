"use client";

import { useMemo, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

interface IZoomRange {
  min: number;
  max: number;
  step?: number;
}

interface IZoomSliderProps {
  track: MediaStreamTrack | null;
}

export default function ZoomSlider({ track }: IZoomSliderProps) {
  const [zoom, setZoom] = useState<number | null>(null);

  const range = useMemo<IZoomRange | null>(() => {
    if (!track) return null;

    const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
      zoom?: IZoomRange;
    };

    return capabilities.zoom && capabilities.zoom.max > capabilities.zoom.min
      ? capabilities.zoom
      : null;
  }, [track]);

  if (!track || !range) return null;

  const value = Math.min(range.max, Math.max(range.min, zoom ?? range.min));

  function handleChange(next: number) {
    setZoom(next);
    track
      ?.applyConstraints({
        advanced: [{ zoom: next } as MediaTrackConstraintSet],
      })
      .catch(() => {});
  }

  return (
    <div className="absolute bottom-3 left-1/2 z-20 flex w-2/3 -translate-x-1/2 items-center gap-2 rounded-full bg-black/50 px-3 py-2">
      <ZoomOut className="size-4 shrink-0 text-white" />
      <input
        type="range"
        min={range.min}
        max={range.max}
        step={range.step ?? 0.1}
        value={value}
        onChange={(e) => handleChange(Number(e.target.value))}
        aria-label="Camera zoom"
        className="w-full accent-primary"
      />
      <ZoomIn className="size-4 shrink-0 text-white" />
    </div>
  );
}
