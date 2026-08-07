import { createPenBadgeIcon } from "@/components/custom/icons/pen-badge";

/**
 * Lucide's share-2, badged with a pen: the list is already shared, so the button opens
 * the settings rather than starting a share. Only the owner ever sees it, because
 * linkAccess comes back null for everyone else.
 */
const Share2Pen = createPenBadgeIcon("share-2-pen", [
  ["circle", { cx: "18", cy: "5", r: "3", key: "node-top" }],
  ["circle", { cx: "6", cy: "12", r: "3", key: "node-left" }],
  ["circle", { cx: "18", cy: "19", r: "3", key: "node-bottom" }],
  [
    "line",
    { x1: "8.59", x2: "15.42", y1: "13.51", y2: "17.49", key: "edge-lower" },
  ],
  [
    "line",
    { x1: "15.41", x2: "8.59", y1: "6.51", y2: "10.49", key: "edge-upper" },
  ],
]);

export default Share2Pen;
