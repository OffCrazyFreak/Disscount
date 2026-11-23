import { useState } from "react";

/** So on mobile the tooltip lasts only while touching; with no touch events, desktop keeps its hover. */
export function useTouchTooltipDismiss() {
  const [touchHidden, setTouchHidden] = useState(false);

  function show() {
    setTouchHidden(false);
  }

  function hide() {
    setTouchHidden(true);
  }

  return {
    // Passed to <ChartTooltip active>: false hides it, undefined lets Recharts decide.
    tooltipActive: touchHidden ? (false as const) : undefined,
    touchHandlers: {
      onTouchStart: show,
      onTouchMove: show,
      onTouchEnd: hide,
      onTouchCancel: hide,
    },
  };
}
