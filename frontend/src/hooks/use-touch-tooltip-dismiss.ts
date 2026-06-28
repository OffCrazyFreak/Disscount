import { useCallback, useState } from "react";

/**
 * Force-hides a Recharts tooltip when a touch gesture ends, so on mobile the
 * tooltip only stays visible while the finger is on the chart. On desktop no
 * touch events fire, so `tooltipActive` stays undefined and Recharts keeps its
 * normal hover behavior.
 *
 * Usage:
 *   const { tooltipActive, touchHandlers } = useTouchTooltipDismiss();
 *   <ChartContainer {...touchHandlers}>
 *     <LineChart ...>
 *       <ChartTooltip active={tooltipActive} ... />
 *     </LineChart>
 *   </ChartContainer>
 */
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
