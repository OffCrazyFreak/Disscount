import type { Map as MapLibreMap } from "maplibre-gl";

import {
  chainIconId,
  ICON_PIXEL_RATIO,
  renderChainIcon,
  renderSelectedFrame,
  SELECTED_FRAME_ID,
  SELECTED_STACK_FRAME_ID,
} from "@/app/[locale]/map/utils/chain-icon";

/**
 * Adds every chain logo and the selection frames as map
 * images, once per map.
 */
export async function registerChainIcons(map: MapLibreMap, chains: string[]) {
  const drawn = [
    [SELECTED_FRAME_ID, () => renderSelectedFrame(false)],
    [SELECTED_STACK_FRAME_ID, () => renderSelectedFrame(true)],
  ] as const;

  for (const [id, render] of drawn) {
    if (!map.hasImage(id)) {
      map.addImage(id, render(), { pixelRatio: ICON_PIXEL_RATIO });
    }
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
