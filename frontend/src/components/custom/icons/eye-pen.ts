import { createPenBadgeIcon } from "@/components/custom/icons/pen-badge";

/**
 * Lucide's eye, badged with a pen. Says "you already track this, and the button edits
 * that", where the eye-off it replaced read as "stop watching", which the button does
 * not do.
 */
const EyePen = createPenBadgeIcon("EyePen", [
  [
    "path",
    {
      d: "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",
      key: "eye",
    },
  ],
  ["circle", { cx: "12", cy: "12", r: "3", key: "pupil" }],
]);

export default EyePen;
