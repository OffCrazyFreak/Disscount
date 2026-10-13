import type { Map as MapLibreMap } from "maplibre-gl";

import {
  chainIconId,
  COUNT_BADGE_ID,
  ICON_PIXEL_RATIO,
  renderChainIcon,
  renderCountBadge,
} from "@/app/map/utils/chain-icon";

/** Adds every chain logo and the count badge as map images, once per map. */
export async function registerChainIcons(map: MapLibreMap, chains: string[]) {
  if (!map.hasImage(COUNT_BADGE_ID)) {
    map.addImage(COUNT_BADGE_ID, renderCountBadge(), {
      pixelRatio: ICON_PIXEL_RATIO,
    });
  }

  await Promise.all(
    chains.map(async (chain) => {
      const id = chainIconId(chain);
      if (map.hasImage(id)) return;

      const icon = await renderChainIcon(chain);

      if (!map.hasImage(id))
        map.addImage(id, icon, { pixelRatio: ICON_PIXEL_RATIO });
    }),
  );
}
