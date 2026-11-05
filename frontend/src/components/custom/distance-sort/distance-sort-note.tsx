"use client";

import { useTranslations } from "next-intl";
import type { DistanceSortState } from "@/hooks/use-distance-sort";
import type { IDistanceOrigin } from "@/hooks/use-distance-origin";
import type { IStoreTown } from "@/utils/store-towns";
import TownPicker from "@/components/custom/distance-sort/town-picker";
import { useTownLabel } from "@/hooks/use-town-label";

interface IDistanceSortNoteProps {
  id: string;
  state: DistanceSortState;
  origin: IDistanceOrigin | null;
  towns: IStoreTown[];
  onPickTown: (town: string) => void;
}

function readMessageKey(
  state: Exclude<DistanceSortState, "idle">,
  origin: IDistanceOrigin | null,
) {
  if (state !== "ready" || !origin?.town) return state;

  return origin.source === "saved" ? "readyFromSavedPlace" : "readyFromTown";
}

/** The live region stays mounted, so a screen reader hears each change of state. */
export default function DistanceSortNote({
  id,
  state,
  origin,
  towns,
  onPickTown,
}: IDistanceSortNoteProps) {
  const t = useTranslations("common.distanceSort");
  const townLabel = useTownLabel();
  const hasTownOrigin = origin?.town != null;
  // Still shown while a picked town's sort finishes loading, so focus stays.
  const isFromTown =
    hasTownOrigin && (state === "ready" || state === "locating");
  const isLocationFailure =
    state === "denied" || state === "unavailable" || state === "timeout";

  return (
    <div
      // sr-only because a region leaving the accessibility tree is often not announced on return.
      className={
        state === "idle"
          ? "sr-only"
          : "flex flex-wrap items-center gap-x-3 gap-y-2"
      }
    >
      <p
        id={id}
        role="status"
        className="text-sm text-muted-foreground text-pretty"
      >
        {state === "idle"
          ? null
          : t(readMessageKey(state, origin), {
              town: origin?.town
                ? townLabel({ ...origin, name: origin.town })
                : "",
            })}
      </p>

      {(isFromTown || isLocationFailure) && towns.length > 0 && (
        <TownPicker isChange={isFromTown} towns={towns} onPick={onPickTown} />
      )}
    </div>
  );
}
