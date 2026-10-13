import { Info } from "lucide-react";

import { pluralizeCroatian } from "@/utils/strings";

interface IMissingStoresNoteProps {
  shown: number;
  unplaced: number;
}

/** Says how many results the map cannot pin, so a short map is not a mystery. */
export default function MissingStoresNote({
  shown,
  unplaced,
}: IMissingStoresNoteProps) {
  return (
    <p
      role="status"
      className="flex items-start gap-2 text-sm text-muted-foreground"
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>
        {shown} {pluralizeCroatian(shown, "trgovina", "trgovine", "trgovina")}
        {unplaced > 0 &&
          `, od toga ${unplaced} bez lokacije na karti. One su i dalje na popisu.`}
      </span>
    </p>
  );
}
