import { useCallback, useState } from "react";

/** So on mobile the tooltip stays only while the finger is on the chart; no touch events fire on desktop, so Recharts keeps its hover. */
export function useTouchTooltipDismiss() {
  const [touchHidden, setTouchHidden] = useState(false);

  const show = useCallback(() => setTouchHidden(false), []);
  const hide = useCallback(() => setTouchHidden(true), []);

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
