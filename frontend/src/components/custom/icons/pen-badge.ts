import { createLucideIcon } from "lucide-react";

/** Verbatim from Lucide's file-pen and user-pen, so badged icons carry the set's own nib. */
const PEN_PATH =
  "M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z";

/** One rule for any base; 0.7 is the largest scale at which every base clears the pen by a stroke. */
const BASE_TRANSFORM = "scale(0.7)";

/** A transform scales strokes with it, so this pre-divides to land back on lucide's 2. */
const BASE_STROKE_WIDTH = "2.857";

export type PenBadgeBase = ["path" | "circle" | "line", Record<string, string>];

/** name is kebab-case, because createLucideIcon emits a malformed class pair for a PascalCase name. */
export function createPenBadgeIcon(name: string, base: PenBadgeBase[]) {
  return createLucideIcon(name, [
    ...base.map(([element, attrs]): PenBadgeBase => [
      element,
      { ...attrs, transform: BASE_TRANSFORM, strokeWidth: BASE_STROKE_WIDTH },
    ]),
    ["path", { d: PEN_PATH, key: "pen" }],
  ]);
}
