export interface ISectionJumpNavItem {
  /** The section element's id, which is also the URL hash */
  id: string;
  label: string;
  /** Phone wording, where the full label would crowd an equal-width link */
  shortLabel?: string;
  /** Shown as a badge after the label; hidden when zero or missing */
  count?: number;
}
