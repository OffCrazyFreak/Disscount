import type { ReactNode } from "react";

export interface ISectionTab {
  /** The URL hash that opens this tab */
  id: string;
  label: string;
  /** Phone wording, where the full label would crowd an equal-width tab */
  shortLabel?: string;
  /** Shown as a badge after the label; hidden when zero or missing */
  count?: number;
  /** Turns the badge into "count/total", such as checked items of all items */
  total?: number;
  /** Spoken name when the badge alone is ambiguous; must contain the visible label */
  accessibleName?: string;
  content: ReactNode;
}
