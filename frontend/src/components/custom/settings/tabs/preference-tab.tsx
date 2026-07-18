"use client";

import { PinnedStoresGrid } from "@/components/custom/settings/tabs/pinned-stores-grid";
import { PinnedPlacesSelect } from "@/components/custom/settings/tabs/pinned-places-select";

export function PreferenceTab() {
  return (
    <div className="space-y-8">
      <PinnedStoresGrid />
      <PinnedPlacesSelect />
    </div>
  );
}
