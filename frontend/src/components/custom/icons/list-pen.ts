import { createPenBadgeIcon } from "@/components/custom/icons/pen-badge";

/**
 * Lucide's list, badged with a pen: the partner to list-plus, for a product that is
 * already on the list so the button edits the entry instead of adding one. Plain list
 * rather than list-checks, which turns to mush once shrunk to make room for the pen.
 */
const ListPen = createPenBadgeIcon("list-pen", [
  ["path", { d: "M3 5h.01", key: "dot-1" }],
  ["path", { d: "M3 12h.01", key: "dot-2" }],
  ["path", { d: "M3 19h.01", key: "dot-3" }],
  ["path", { d: "M8 5h13", key: "line-1" }],
  ["path", { d: "M8 12h13", key: "line-2" }],
  ["path", { d: "M8 19h13", key: "line-3" }],
]);

export default ListPen;
