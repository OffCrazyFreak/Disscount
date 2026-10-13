import type { CSSProperties } from "react";

import { LIGHT_TEXT_COLOR, DARK_TEXT_COLOR } from "@/utils/color-contrast";

const ARCHIVED_GREY_FOR_LIGHT_INK = "#3d3d3d";
const ARCHIVED_GREY_FOR_DARK_INK = "#e2e2e2";

/**
 * Per-tile custom properties. `--away` is the colour every decorative layer moves toward,
 * the far side from the ink, so no layer can lower the text contrast.
 */
export function cardTileStyle(
  cardColor: string,
  ink: string,
  archived: boolean,
): CSSProperties {
  const lightInk = ink === LIGHT_TEXT_COLOR;
  const grey = lightInk
    ? ARCHIVED_GREY_FOR_LIGHT_INK
    : ARCHIVED_GREY_FOR_DARK_INK;

  return {
    "--c": cardColor,
    "--ink": ink,
    "--away": lightInk ? "#000000" : "#ffffff",
    "--opp": lightInk ? DARK_TEXT_COLOR : LIGHT_TEXT_COLOR,
    "--surface": archived
      ? `color-mix(in oklab, ${cardColor}, ${grey} 55%)`
      : cardColor,
    // Ring a light logo disc needs to stay visible against a light card.
    "--logo-ring": lightInk ? "rgb(0 0 0 / 0.14)" : "rgb(17 24 39 / 0.6)",
  } as CSSProperties;
}
