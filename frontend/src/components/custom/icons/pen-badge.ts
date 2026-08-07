import { createLucideIcon } from "lucide-react";

/**
 * Lucide's own pen, lifted verbatim from file-pen and user-pen, so a badged icon carries
 * the same nib the rest of the set does rather than a lookalike drawn by hand.
 */
const PEN_PATH =
  "M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z";

/**
 * Lucide's own composites clear the pen's corner by redrawing the base shape shorter.
 * These shrink it into the top-left instead: one rule that holds for any base, rather
 * than a bespoke outline per icon. 0.7 is the largest scale at which every base badged
 * below still clears the pen by a full stroke width.
 */
const BASE_TRANSFORM = "scale(0.7)";

/** A transform scales strokes with it, so this pre-divides to land back on lucide's 2. */
const BASE_STROKE_WIDTH = "2.857";

export type PenBadgeBase = ["path" | "circle" | "line", Record<string, string>];

/**
 * @param name kebab-case, as lucide's own icons pass it. createLucideIcon emits
 *   `lucide-${toKebabCase(toPascalCase(name))} lucide-${name}`, so a PascalCase name
 *   produces a malformed pair like "lucide-share2-pen lucide-Share2Pen".
 */
export function createPenBadgeIcon(name: string, base: PenBadgeBase[]) {
  return createLucideIcon(name, [
    ...base.map(([element, attrs]): PenBadgeBase => [
      element,
      { ...attrs, transform: BASE_TRANSFORM, strokeWidth: BASE_STROKE_WIDTH },
    ]),
    ["path", { d: PEN_PATH, key: "pen" }],
  ]);
}
