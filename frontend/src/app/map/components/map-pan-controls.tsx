"use client";

import { RefObject } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import type { MapRef } from "react-map-gl/maplibre";

import { cn } from "@/lib/utils";

interface IMapPanControlsProps {
  mapRef: RefObject<MapRef | null>;
}

const STEP_PX = 160;

const DIRECTIONS = [
  {
    label: "Pomakni kartu gore",
    icon: ArrowUp,
    offset: [0, -STEP_PX],
    area: "col-start-2",
  },
  {
    label: "Pomakni kartu lijevo",
    icon: ArrowLeft,
    offset: [-STEP_PX, 0],
    area: "col-start-1 row-start-2",
  },
  {
    label: "Pomakni kartu desno",
    icon: ArrowRight,
    offset: [STEP_PX, 0],
    area: "col-start-3 row-start-2",
  },
  {
    label: "Pomakni kartu dolje",
    icon: ArrowDown,
    offset: [0, STEP_PX],
    area: "col-start-2 row-start-3",
  },
] as const;

/**
 * Panning is a drag, and WCAG 2.5.7 asks for a single-pointer way to do
 * anything that takes a drag. Arrow keys already pan the focused map.
 */
export default function MapPanControls({ mapRef }: IMapPanControlsProps) {
  return (
    <div
      role="group"
      aria-label="Pomicanje karte"
      className="absolute right-2.5 top-32 z-[1] hidden grid-cols-3 grid-rows-3 gap-1 md:grid"
    >
      {DIRECTIONS.map(({ label, icon: Icon, offset, area }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          title={label}
          onClick={() => mapRef.current?.panBy([offset[0], offset[1]])}
          className={cn(
            area,
            "flex size-8 items-center justify-center rounded-md border bg-background shadow-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
