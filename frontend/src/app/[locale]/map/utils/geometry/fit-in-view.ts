import { IMapCover } from "@/app/[locale]/map/utils/geometry/view-area";

/** A box in the map container's pixels. */
export interface IBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface IPan {
  x: number;
  y: number;
}

// Keeps the card and pin off the very edge of the header, panel, sheet or screen.
const EDGE_MARGIN = 12;

export function visibleBox(
  width: number,
  height: number,
  cover: IMapCover,
): IBox {
  return {
    left: EDGE_MARGIN,
    top: cover.top + EDGE_MARGIN,
    right: width - cover.right - EDGE_MARGIN,
    bottom: height - cover.bottom - EDGE_MARGIN,
  };
}

/** How far to move the camera so a span sits inside the area; one too long for it starts at the area's start. */
function fitSpan(
  start: number,
  end: number,
  areaStart: number,
  areaEnd: number,
) {
  if (end - start > areaEnd - areaStart || start < areaStart) {
    return start - areaStart;
  }

  if (end > areaEnd) return end - areaEnd;

  return 0;
}

function union(a: IBox, b: IBox): IBox {
  return {
    left: Math.min(a.left, b.left),
    top: Math.min(a.top, b.top),
    right: Math.max(a.right, b.right),
    bottom: Math.max(a.bottom, b.bottom),
  };
}

/** The panBy that brings the pin and its card into the area; when both cannot fit, the card wins. */
export function cameraPanToFit(pin: IBox, card: IBox | null, area: IBox): IPan {
  const both = card ? union(pin, card) : pin;
  const wide = both.right - both.left > area.right - area.left;
  const tall = both.bottom - both.top > area.bottom - area.top;
  const across = wide && card ? card : both;
  const down = tall && card ? card : both;

  return {
    x: fitSpan(across.left, across.right, area.left, area.right),
    y: fitSpan(down.top, down.bottom, area.top, area.bottom),
  };
}
